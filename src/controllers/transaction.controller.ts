import { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/errors";
import { listUserTransactions } from "../services/transaction.service";

const userIdParamSchema = z.object({
  userId: z.string().uuid()
});

export async function listTransactionsHandler(req: Request, res: Response) {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid user id", parsed.error.flatten());
  }

  const result = await listUserTransactions(parsed.data.userId);
  res.status(200).json({ data: result });
}
