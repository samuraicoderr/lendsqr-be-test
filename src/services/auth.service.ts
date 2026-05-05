import { db } from "../db/knex";
import { ApiError } from "../utils/errors";
import { createVerificationToken, hashPassword, hashToken, signAuthToken, verifyAuthToken, verifyPassword } from "../utils/auth";
import { newId } from "../utils/ids";
import { findWalletByUserId, insertWallet } from "../repositories/wallet.repository";
import {
  findUserByEmail,
  findUserById,
  findUserByVerificationTokenHash,
  insertUser,
  updateUserById
} from "../repositories/user.repository";
import { checkEmailBlacklist } from "./adjutor.service";
import { renderVerificationEmail } from "../email_templates";
import { sendEmail } from "./email.service";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";
import { generateUniqueAccountNumber } from "../utils/account";
import { sendLoginSuccessNotification } from "./notification.service";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  baseUrl: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ResendVerificationInput = {
  email: string;
  password: string;
  baseUrl: string;
};

export async function registerUser(input: RegisterInput) {
  const blacklist = await checkEmailBlacklist(input.email);
  if (blacklist.isBlacklisted) {
    throw ApiError.forbidden("User is blacklisted");
  }

  return db.transaction(async (trx) => {
    const existing = await findUserByEmail(trx, input.email);
    if (existing) {
      throw ApiError.conflict("Email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const { token, tokenHash, expiresAt } = createVerificationToken();

    const userId = newId();
    const walletId = newId();
    const accountNumber = await generateUniqueAccountNumber(trx);

    await insertUser(trx, {
      id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      is_blacklisted: false,
      password_hash: passwordHash,
      is_email_verified: false,
      is_two_factor_enabled: false,
      is_admin: true,
      email_verification_token_hash: tokenHash,
      email_verification_expires_at: expiresAt,
      email_verified_at: null
    });

    await insertWallet(trx, {
      id: walletId,
      user_id: userId,
      account_number: accountNumber,
      balance: "0.00",
      currency: "NGN"
    });

    const verificationUrl = `${input.baseUrl}/api/v1/auth/verify?token=${token}`;
    const htmlBody = renderVerificationEmail({
      firstName: input.firstName,
      verificationUrl
    });

    await sendEmail({
      to: [input.email],
      subject: "Verify your email",
      htmlBody,
      textBody: `Verify your email: ${verificationUrl}`
    });

    return {
      id: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      isEmailVerified: false,
      isTwoFactorEnabled: false,
      isAdmin: true,
      wallet: {
        id: walletId,
        accountNumber,
        balance: "0.00",
        currency: "NGN"
      }
    };
  });
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(db, input.email);
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const valid = await verifyPassword(user.password_hash, input.password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (!Boolean(user.is_email_verified)) {
    throw ApiError.forbidden("Email is not verified");
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    isAdmin: Boolean(user.is_admin),
    isEmailVerified: Boolean(user.is_email_verified)
  });

  const mappedUser = mapUser(user);

  await sendLoginSuccessNotification({
    email: user.email,
    firstName: user.first_name
  });

  return {
    token,
    user: mappedUser
  };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const user = await findUserByVerificationTokenHash(db, tokenHash);
  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  if (!user.email_verification_expires_at || user.email_verification_expires_at < new Date()) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  await updateUserById(db, user.id, {
    is_email_verified: true,
    email_verified_at: new Date(),
    email_verification_token_hash: null,
    email_verification_expires_at: null
  });

  return mapUser({
    ...user,
    is_email_verified: true,
    email_verified_at: new Date(),
    email_verification_token_hash: null,
    email_verification_expires_at: null
  });
}

export async function resendVerification(input: ResendVerificationInput) {
  const user = await findUserByEmail(db, input.email);
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const valid = await verifyPassword(user.password_hash, input.password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (Boolean(user.is_email_verified)) {
    throw ApiError.conflict("Email is already verified");
  }

  const { token, tokenHash, expiresAt } = createVerificationToken();

  await updateUserById(db, user.id, {
    email_verification_token_hash: tokenHash,
    email_verification_expires_at: expiresAt
  });

  const verificationUrl = `${input.baseUrl}/api/v1/auth/verify?token=${token}`;
  const htmlBody = renderVerificationEmail({
    firstName: user.first_name,
    verificationUrl
  });

  await sendEmail({
    to: [user.email],
    subject: "Verify your email",
    htmlBody,
    textBody: `Verify your email: ${verificationUrl}`
  });

  return { message: "Verification email sent" };
}

export async function resolveUserFromToken(token: string): Promise<AuthUser> {
  if (token === env.apiToken) {
    return resolveDummyUser();
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    throw ApiError.unauthorized("Invalid token");
  }

  const user = await findUserById(db, payload.sub);
  if (!user) {
    throw ApiError.unauthorized("Invalid token");
  }

  return mapUser(user);
}

async function resolveDummyUser(): Promise<AuthUser> {
  const existing = await findUserByEmail(db, env.dummyUser.email);
  if (existing) {
    const wallet = await findWalletByUserId(db, existing.id);
    if (!wallet) {
      await insertWallet(db, {
        id: newId(),
        user_id: existing.id,
        account_number: await generateUniqueAccountNumber(db),
        balance: "0.00",
        currency: "NGN"
      });
    }
    return mapUser(existing);
  }

  const passwordHash = await hashPassword(env.dummyUser.rawPassword);
  const userId = newId();

  await insertUser(db, {
    id: userId,
    first_name: env.dummyUser.firstName,
    last_name: env.dummyUser.lastName,
    email: env.dummyUser.email,
    is_blacklisted: false,
    password_hash: passwordHash,
    is_email_verified: env.dummyUser.isEmailVerified,
    is_two_factor_enabled: false,
    is_admin: true,
    email_verification_token_hash: null,
    email_verification_expires_at: null,
    email_verified_at: env.dummyUser.isEmailVerified ? new Date() : null
  });

  await insertWallet(db, {
    id: newId(),
    user_id: userId,
    account_number: await generateUniqueAccountNumber(db),
    balance: "0.00",
    currency: "NGN"
  });

  return {
    id: userId,
    email: env.dummyUser.email,
    firstName: env.dummyUser.firstName,
    lastName: env.dummyUser.lastName,
    isEmailVerified: env.dummyUser.isEmailVerified,
    isTwoFactorEnabled: false,
    isAdmin: true
  };
}

function mapUser(user: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: number | boolean;
  is_two_factor_enabled: number | boolean;
  is_admin: number | boolean;
  email_verified_at?: Date | null;
  email_verification_token_hash?: string | null;
  email_verification_expires_at?: Date | null;
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
