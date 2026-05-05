import { Knex } from "knex";
import { DbOrTrx } from "./user.repository";

export interface WalletRow {
  id: string;
  user_id: string;
  account_number: string;
  balance: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export async function insertWallet(db: DbOrTrx, wallet: Omit<WalletRow, "created_at" | "updated_at">): Promise<void> {
  await db<WalletRow>("wallets").insert(wallet);
}

export async function findWalletByUserId(
  db: DbOrTrx,
  userId: string
): Promise<WalletRow | undefined> {
  return db<WalletRow>("wallets").where({ user_id: userId }).first();
}

export async function findWalletByAccountNumber(
  db: DbOrTrx,
  accountNumber: string
): Promise<WalletRow | undefined> {
  return db<WalletRow>("wallets").where({ account_number: accountNumber }).first();
}

export async function findWalletByUserIdForUpdate(
  db: Knex.Transaction,
  userId: string
): Promise<WalletRow | undefined> {
  return db<WalletRow>("wallets").where({ user_id: userId }).forUpdate().first();
}

export async function findWalletsByIdsForUpdate(
  db: Knex.Transaction,
  walletIds: string[]
): Promise<WalletRow[]> {
  return db<WalletRow>("wallets")
    .whereIn("id", walletIds)
    .orderBy("id", "asc")
    .forUpdate();
}

export async function findWalletsByUserIdsForUpdate(
  db: Knex.Transaction,
  userIds: string[]
): Promise<WalletRow[]> {
  return db<WalletRow>("wallets")
    .whereIn("user_id", userIds)
    .orderBy("id", "asc")
    .forUpdate();
}

export async function updateWalletBalance(
  db: DbOrTrx,
  walletId: string,
  balance: string
): Promise<void> {
  await db<WalletRow>("wallets").where({ id: walletId }).update({ balance });
}
