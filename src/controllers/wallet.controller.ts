import { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/errors";
import { fundWallet, getWalletByUserId, transferWallet, withdrawWallet } from "../services/wallet.service";

const fundSchema = z.object({
  userId: z.string().uuid(),
  amount: z.union([z.string(), z.number()]),
  reference: z.string().min(6).max(100),
  metadata: z.record(z.any()).optional()
});

const withdrawSchema = z.object({
  userId: z.string().uuid(),
  amount: z.union([z.string(), z.number()]),
  reference: z.string().min(6).max(100),
  metadata: z.record(z.any()).optional()
});

const transferSchema = z.object({
  senderUserId: z.string().uuid(),
  receiverUserId: z.string().uuid(),
  amount: z.union([z.string(), z.number()]),
  reference: z.string().min(6).max(100),
  metadata: z.record(z.any()).optional()
});

const userIdParamSchema = z.object({
  userId: z.string().uuid()
});

export async function fundWalletHandler(req: Request, res: Response) {
  const parsed = fundSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await fundWallet(parsed.data);
  res.status(200).json({ data: result });
}

export async function withdrawWalletHandler(req: Request, res: Response) {
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await withdrawWallet(parsed.data);
  res.status(200).json({ data: result });
}

export async function transferWalletHandler(req: Request, res: Response) {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await transferWallet(parsed.data);
  res.status(200).json({ data: result });
}

export async function getWalletHandler(req: Request, res: Response) {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid user id", parsed.error.flatten());
  }

  const result = await getWalletByUserId(parsed.data.userId);
  res.status(200).json({ data: result });
}
