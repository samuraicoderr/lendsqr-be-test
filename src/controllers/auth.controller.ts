import { Request, Response } from "express";
import { ApiError } from "../utils/errors";
import {
  loginUser,
  registerUser,
  resendVerification,
  verifyEmailToken
} from "../services/auth.service";
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema
} from "../validation/auth.schema";
import { resolveBaseUrl } from "../utils/http";

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await registerUser({
    ...parsed.data,
    baseUrl: resolveBaseUrl(req)
  });

  res.status(201).json({ data: result });
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await loginUser(parsed.data);
  res.status(200).json({ data: result });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request", parsed.error.flatten());
  }

  const result = await verifyEmailToken(parsed.data.token);
  res.status(200).json({ data: result });
}

export async function resendVerificationHandler(req: Request, res: Response) {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await resendVerification({
    ...parsed.data,
    baseUrl: resolveBaseUrl(req)
  });
  res.status(200).json({ data: result });
}
