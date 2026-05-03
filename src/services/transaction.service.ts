import { db } from "../db/knex";
import { ApiError } from "../utils/errors";
import { findWalletByUserId } from "../repositories/wallet.repository";
import { listTransactionsByWalletId } from "../repositories/transaction.repository";

export async function listUserTransactions(userId: string) {
  const wallet = await findWalletByUserId(db, userId);
  if (!wallet) {
    throw ApiError.notFound("Wallet not found");
  }

  const transactions = await listTransactionsByWalletId(db, wallet.id);

  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    type: transaction.type,
    amount: transaction.amount,
    status: transaction.status,
    reference: transaction.reference,
    metadata: transaction.metadata,
    createdAt: transaction.created_at
  }));
}
