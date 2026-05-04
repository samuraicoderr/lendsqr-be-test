import { db } from "../db/knex";
import { ApiError } from "../utils/errors";
import { findUserById, listUsers } from "../repositories/user.repository";
import { AuthUser } from "../types/auth";

export async function getUserById(id: string): Promise<AuthUser> {
  const user = await findUserById(db, id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return mapUser(user);
}

export async function getUserProfile(user: AuthUser): Promise<AuthUser> {
  return user;
}

export async function listAllUsers(): Promise<AuthUser[]> {
  const users = await listUsers(db);
  return users.map(mapUser);
}

function mapUser(user: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: number | boolean;
  is_two_factor_enabled: number | boolean;
  is_admin: number | boolean;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isEmailVerified: Boolean(user.is_email_verified),
    isTwoFactorEnabled: Boolean(user.is_two_factor_enabled),
    isAdmin: Boolean(user.is_admin)
  };
}
