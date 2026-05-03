import { db } from "../db/knex";
import { ApiError } from "../utils/errors";
import { newId } from "../utils/ids";
import { addAmounts, hasSufficientBalance, parseAmount, subtractAmounts } from "../utils/money";
import {
  findWalletByUserId,
  findWalletByUserIdForUpdate,
  findWalletsByUserIdsForUpdate,
  updateWalletBalance
} from "../repositories/wallet.repository";
import { findTransactionByReference, insertTransaction } from "../repositories/transaction.repository";
import { findTransferByReference, insertTransfer } from "../repositories/transfer.repository";

export interface FundWalletInput {
  userId: string;
  amount: string | number;
  reference: string;
  metadata?: object;
}

export interface WithdrawWalletInput {
  userId: string;
  amount: string | number;
  reference: string;
  metadata?: object;
}

export interface TransferWalletInput {
  senderUserId: string;
  receiverUserId: string;
  amount: string | number;
  reference: string;
  metadata?: object;
}

export async function getWalletByUserId(userId: string) {
  const wallet = await findWalletByUserId(db, userId);
  if (!wallet) {
    throw ApiError.notFound("Wallet not found");
  }

  return {
    id: wallet.id,
    userId: wallet.user_id,
    balance: wallet.balance,
    currency: wallet.currency
  };
}

export async function fundWallet(input: FundWalletInput) {
  const amount = parseAmount(input.amount);

  return db.transaction(async (trx) => {
    const wallet = await findWalletByUserIdForUpdate(trx, input.userId);
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    const existing = await findTransactionByReference(trx, input.reference);
    if (existing) {
      if (existing.wallet_id !== wallet.id) {
        throw ApiError.conflict("Reference already used by another wallet");
      }
      return {
        walletId: wallet.id,
        balance: wallet.balance,
        transactionId: existing.id,
        reference: existing.reference
      };
    }

    const transactionId = newId();
    const newBalance = addAmounts(wallet.balance, amount);

    await insertTransaction(trx, {
      id: transactionId,
      wallet_id: wallet.id,
      type: "credit",
      amount,
      reference: input.reference,
      status: "success",
      metadata: input.metadata ?? null
    });

    await updateWalletBalance(trx, wallet.id, newBalance);

    return {
      walletId: wallet.id,
      balance: newBalance,
      transactionId,
      reference: input.reference
    };
  });
}

export async function withdrawWallet(input: WithdrawWalletInput) {
  const amount = parseAmount(input.amount);

  return db.transaction(async (trx) => {
    const wallet = await findWalletByUserIdForUpdate(trx, input.userId);
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    const existing = await findTransactionByReference(trx, input.reference);
    if (existing) {
      if (existing.wallet_id !== wallet.id) {
        throw ApiError.conflict("Reference already used by another wallet");
      }
      return {
        walletId: wallet.id,
        balance: wallet.balance,
        transactionId: existing.id,
        reference: existing.reference
      };
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
      reference: input.reference,
      status: "success",
      metadata: input.metadata ?? null
    });

    await updateWalletBalance(trx, wallet.id, newBalance);

    return {
      walletId: wallet.id,
      balance: newBalance,
      transactionId,
      reference: input.reference
    };
  });
}

export async function transferWallet(input: TransferWalletInput) {
  if (input.senderUserId === input.receiverUserId) {
    throw ApiError.badRequest("Sender and receiver must be different");
  }

  const amount = parseAmount(input.amount);

  return db.transaction(async (trx) => {
    const existingTransfer = await findTransferByReference(trx, input.reference);
    if (existingTransfer) {
      return {
        transferId: existingTransfer.id,
        reference: existingTransfer.reference
      };
    }

    const wallets = await findWalletsByUserIdsForUpdate(trx, [
      input.senderUserId,
      input.receiverUserId
    ]);

    const senderWallet = wallets.find((wallet) => wallet.user_id === input.senderUserId);
    const receiverWallet = wallets.find((wallet) => wallet.user_id === input.receiverUserId);

    if (!senderWallet || !receiverWallet) {
      throw ApiError.notFound("Sender or receiver wallet not found");
    }

    if (!hasSufficientBalance(senderWallet.balance, amount)) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transferId = newId();
    const senderBalance = subtractAmounts(senderWallet.balance, amount);
    const receiverBalance = addAmounts(receiverWallet.balance, amount);

    await insertTransfer(trx, {
      id: transferId,
      sender_wallet_id: senderWallet.id,
      receiver_wallet_id: receiverWallet.id,
      amount,
      reference: input.reference,
      status: "success"
    });

    await insertTransaction(trx, {
      id: newId(),
      wallet_id: senderWallet.id,
      type: "debit",
      amount,
      reference: `${input.reference}-debit`,
      status: "success",
      metadata: {
        transferId,
        counterpartyWalletId: receiverWallet.id,
        ...(input.metadata ?? {})
      }
    });

    await insertTransaction(trx, {
      id: newId(),
      wallet_id: receiverWallet.id,
      type: "credit",
      amount,
      reference: `${input.reference}-credit`,
      status: "success",
      metadata: {
        transferId,
        counterpartyWalletId: senderWallet.id,
        ...(input.metadata ?? {})
      }
    });

    await updateWalletBalance(trx, senderWallet.id, senderBalance);
    await updateWalletBalance(trx, receiverWallet.id, receiverBalance);

    return {
      transferId,
      reference: input.reference,
      senderWalletId: senderWallet.id,
      receiverWalletId: receiverWallet.id,
      senderBalance,
      receiverBalance
    };
  });
}
