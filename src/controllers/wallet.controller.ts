import { Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { fundWallet, getWalletByUserId, transferWallet, withdrawWallet } from "../services/wallet.service";
import { listUserTransactions } from "../services/transaction.service";
import {
  fundWalletSchema,
  transferWalletSchema,
  withdrawWalletSchema
} from "../validation/wallet.schema";
import { userIdParamSchema } from "../validation/common.schema";

export async function fundWalletHandler(req: Request, res: Response) {
  const parsed = fundWalletSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await fundWallet(parsed.data);
  res.status(200).json({ data: result });
}

export async function withdrawWalletHandler(req: Request, res: Response) {
  const parsed = withdrawWalletSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await withdrawWallet(parsed.data);
  res.status(200).json({ data: result });
}

export async function transferWalletHandler(req: Request, res: Response) {
  const parsed = transferWalletSchema.safeParse(req.body);
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

export async function getWalletBalanceHandler(req: Request, res: Response) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const result = await getWalletByUserId(req.user.id);
  res.status(200).json({ data: result });
}

export async function listWalletTransactionsHandler(req: Request, res: Response) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const result = await listUserTransactions(req.user.id);
  res.status(200).json({ data: result });
}
