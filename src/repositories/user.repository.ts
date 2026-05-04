import { Knex } from "knex";

export type DbOrTrx = Knex | Knex.Transaction;

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_blacklisted: number | boolean;
  password_hash: string;
  is_email_verified: number | boolean;
  is_two_factor_enabled: number | boolean;
  is_admin: number | boolean;
  email_verification_token_hash: string | null;
  email_verification_expires_at: Date | null;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(
  db: DbOrTrx,
  email: string
): Promise<UserRow | undefined> {
  return db<UserRow>("users").where({ email }).first();
}

export async function findUserById(
  db: DbOrTrx,
  id: string
): Promise<UserRow | undefined> {
  return db<UserRow>("users").where({ id }).first();
}

export async function insertUser(db: DbOrTrx, user: Omit<UserRow, "created_at" | "updated_at">): Promise<void> {
  await db<UserRow>("users").insert(user);
}

export async function updateUserById(
  db: DbOrTrx,
  id: string,
  updates: Partial<Omit<UserRow, "id" | "created_at" | "updated_at">>
): Promise<void> {
  await db<UserRow>("users").where({ id }).update(updates);
}

export async function findUserByVerificationTokenHash(
  db: DbOrTrx,
  tokenHash: string
): Promise<UserRow | undefined> {
  return db<UserRow>("users").where({ email_verification_token_hash: tokenHash }).first();
}

export async function listUsers(db: DbOrTrx): Promise<UserRow[]> {
  return db<UserRow>("users").orderBy("created_at", "desc");
}
