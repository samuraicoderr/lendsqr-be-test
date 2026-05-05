import { db } from "../db/knex";
import { ApiError } from "../utils/errors";
import { newId } from "../utils/ids";
import { addAmounts, hasSufficientBalance, parseAmount, subtractAmounts } from "../utils/money";
import {
  findWalletByAccountNumber,
  findWalletByUserId,
  findWalletByUserIdForUpdate,
  findWalletsByIdsForUpdate,
  updateWalletBalance
} from "../repositories/wallet.repository";
import { insertTransaction } from "../repositories/transaction.repository";
import { insertTransfer } from "../repositories/transfer.repository";
import { findUserById } from "../repositories/user.repository";
import {
  sendTransferReceivedNotification,
  sendWalletFundedNotification,
  sendWalletWithdrawnNotification
} from "./notification.service";

export interface FundWalletInput {
  userId: string;
  email: string;
  firstName: string;
  amount: string | number;
}

export interface WithdrawWalletInput {
  userId: string;
  email: string;
  firstName: string;
  amount: string | number;
}

export interface TransferWalletInput {
  senderUserId: string;
  senderFirstName: string;
  senderLastName: string;
  receiverAccountNumber?: string;
  receiverUserId?: string;
  amount: string | number;
}

export async function getWalletByUserId(userId: string) {
  const wallet = await findWalletByUserId(db, userId);
  if (!wallet) {
    throw ApiError.notFound("Wallet not found");
  }

  return {
    id: wallet.id,
    userId: wallet.user_id,
    accountNumber: wallet.account_number,
    balance: wallet.balance,
    currency: wallet.currency
  };
}

export async function fundWallet(input: FundWalletInput) {
  const amount = parseAmount(input.amount);

  const result = await db.transaction(async (trx) => {
    const wallet = await findWalletByUserIdForUpdate(trx, input.userId);
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    const transactionId = newId();
    const newBalance = addAmounts(wallet.balance, amount);

    await insertTransaction(trx, {
      id: transactionId,
      wallet_id: wallet.id,
      type: "credit",
      amount,
      reference: `fund-${transactionId}`,
      status: "success",
      metadata: null
    });

    await updateWalletBalance(trx, wallet.id, newBalance);

    return {
      walletId: wallet.id,
      balance: newBalance,
      transactionId
    };
  });

  await sendWalletFundedNotification({
    email: input.email,
    firstName: input.firstName,
    amount,
    balance: result.balance
  });

  return result;
}

export async function withdrawWallet(input: WithdrawWalletInput) {
  const amount = parseAmount(input.amount);

  const result = await db.transaction(async (trx) => {
    const wallet = await findWalletByUserIdForUpdate(trx, input.userId);
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    if (!hasSufficientBalance(wallet.balance, amount)) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transactionId = newId();
    const newBalance = subtractAmounts(wallet.balance, amount);

    await insertTransaction(trx, {
      id: transactionId,
      wallet_id: wallet.id,
      type: "debit",
      amount,
      reference: `withdraw-${transactionId}`,
      status: "success",
      metadata: null
    });

    await updateWalletBalance(trx, wallet.id, newBalance);

    return {
      walletId: wallet.id,
      balance: newBalance,
      transactionId
    };
  });

  await sendWalletWithdrawnNotification({
    email: input.email,
    firstName: input.firstName,
    amount,
    balance: result.balance
  });

  return result;
}

export async function transferWallet(input: TransferWalletInput) {
  if (Boolean(input.receiverAccountNumber) === Boolean(input.receiverUserId)) {
    throw ApiError.badRequest("Set either receiverAccountNumber or receiverUserId");
  }

  if (input.receiverUserId && input.senderUserId === input.receiverUserId) {
    throw ApiError.badRequest("Sender and receiver must be different");
  }

  const amount = parseAmount(input.amount);

  const result = await db.transaction(async (trx) => {
    const senderWalletLookup = await findWalletByUserId(trx, input.senderUserId);
    if (!senderWalletLookup) {
      throw ApiError.notFound("Sender wallet not found");
    }

    const receiverWalletLookup = input.receiverUserId
      ? await findWalletByUserId(trx, input.receiverUserId)
      : await findWalletByAccountNumber(trx, input.receiverAccountNumber as string);

    if (!receiverWalletLookup) {
      throw ApiError.notFound("Receiver wallet not found");
    }

    if (senderWalletLookup.id === receiverWalletLookup.id) {
      throw ApiError.badRequest("Sender and receiver must be different");
    }

    const wallets = await findWalletsByIdsForUpdate(trx, [
      senderWalletLookup.id,
      receiverWalletLookup.id
    ]);

    const senderWallet = wallets.find((wallet) => wallet.id === senderWalletLookup.id);
    const receiverWallet = wallets.find((wallet) => wallet.id === receiverWalletLookup.id);

    if (!senderWallet || !receiverWallet) {
      throw ApiError.notFound("Sender or receiver wallet not found");
    }

    if (!hasSufficientBalance(senderWallet.balance, amount)) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transferId = newId();
    const reference = `transfer-${transferId}`;
    const senderBalance = subtractAmounts(senderWallet.balance, amount);
    const receiverBalance = addAmounts(receiverWallet.balance, amount);
    const receiverUser = await findUserById(trx, receiverWallet.user_id);

    if (!receiverUser) {
      throw ApiError.notFound("Receiver user not found");
    }

    await insertTransfer(trx, {
      id: transferId,
      sender_wallet_id: senderWallet.id,
      receiver_wallet_id: receiverWallet.id,
      amount,
      reference,
      status: "success"
    });

    await insertTransaction(trx, {
      id: newId(),
      wallet_id: senderWallet.id,
      type: "debit",
      amount,
      reference: `${reference}-debit`,
      status: "success",
      metadata: {
        transferId,
        counterpartyWalletId: receiverWallet.id
      }
    });

    await insertTransaction(trx, {
      id: newId(),
      wallet_id: receiverWallet.id,
      type: "credit",
      amount,
      reference: `${reference}-credit`,
      status: "success",
      metadata: {
        transferId,
        counterpartyWalletId: senderWallet.id
      }
    });

    await updateWalletBalance(trx, senderWallet.id, senderBalance);
    await updateWalletBalance(trx, receiverWallet.id, receiverBalance);

    return {
      transferId,
      senderWalletId: senderWallet.id,
      receiverWalletId: receiverWallet.id,
      senderBalance,
      receiverBalance,
      receiverEmail: receiverUser.email,
      receiverFirstName: receiverUser.first_name
    };
  });

  await sendTransferReceivedNotification({
    email: result.receiverEmail,
    firstName: result.receiverFirstName,
    senderName: `${input.senderFirstName} ${input.senderLastName}`.trim(),
    amount,
    balance: result.receiverBalance
  });

  return {
    transferId: result.transferId,
    senderWalletId: result.senderWalletId,
    receiverWalletId: result.receiverWalletId,
    senderBalance: result.senderBalance,
    receiverBalance: result.receiverBalance
  };
}
