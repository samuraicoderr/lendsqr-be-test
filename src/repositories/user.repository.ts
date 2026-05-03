import { Knex } from "knex";

export type DbOrTrx = Knex | Knex.Transaction;

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_blacklisted: number | boolean;
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
