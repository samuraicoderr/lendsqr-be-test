import { DbOrTrx } from "./user.repository";

export interface TransactionRow {
  id: string;
  wallet_id: string;
  type: "credit" | "debit";
  amount: string;
  reference: string;
  status: "pending" | "success" | "failed";
  metadata: object | null;
  created_at: Date;
}

export async function findTransactionByReference(
  db: DbOrTrx,
  reference: string
): Promise<TransactionRow | undefined> {
  return db<TransactionRow>("transactions").where({ reference }).first();
}

export async function insertTransaction(
  db: DbOrTrx,
  transaction: Omit<TransactionRow, "created_at">
): Promise<void> {
  await db<TransactionRow>("transactions").insert(transaction);
}

export async function listTransactionsByWalletId(
  db: DbOrTrx,
  walletId: string
): Promise<TransactionRow[]> {
  return db<TransactionRow>("transactions")
    .where({ wallet_id: walletId })
    .orderBy("created_at", "desc");
}
