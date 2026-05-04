import { db } from "../db/knex";
import { checkEmailBlacklist } from "./adjutor.service";
import { ApiError } from "../utils/errors";
import { newId } from "../utils/ids";
import { findUserByEmail, insertUser } from "../repositories/user.repository";
import { insertWallet } from "../repositories/wallet.repository";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
}

export async function createUser(input: CreateUserInput) {
  const blacklistResult = await checkEmailBlacklist(input.email);
  if (blacklistResult.isBlacklisted) {
    throw ApiError.forbidden("User is blacklisted");
  }

  return db.transaction(async (trx) => {
    const existing = await findUserByEmail(trx, input.email);
    if (existing) {
      throw ApiError.conflict("Email already exists");
    }

    const userId = newId();
    const walletId = newId();

    await insertUser(trx, {
      id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      is_blacklisted: false
    });

    await insertWallet(trx, {
      id: walletId,
      user_id: userId,
      balance: "0.00",
      currency: "NGN"
    });

    return {
      id: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      wallet: {
        id: walletId,
        balance: "0.00",
        currency: "NGN"
      }
    };
  });
}
