import { z } from "zod";
import { referenceSchema, uuidSchema } from "./common.schema";

export const transactionSchema = z.object({
  id: uuidSchema,
  walletId: uuidSchema,
  type: z.enum(["credit", "debit"]),
  amount: z.string(),
  status: z.enum(["pending", "success", "failed"]),
  reference: referenceSchema,
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime()
});

export const transactionsResponseSchema = z.array(transactionSchema);
