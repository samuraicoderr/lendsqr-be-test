import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.auth.jwtSecret) as AuthTokenPayload;
}

export function createVerificationToken(): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + env.auth.verificationTokenTtlHours * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
