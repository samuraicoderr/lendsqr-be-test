import { z } from "zod";
import { amountSchema, metadataSchema, referenceSchema, uuidSchema } from "./common.schema";

export const walletResponseSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  balance: z.string(),
  currency: z.string()
});

export const fundWalletSchema = z.object({
  userId: uuidSchema,
  amount: amountSchema,
  reference: referenceSchema,
  metadata: metadataSchema
});

export const withdrawWalletSchema = z.object({
  userId: uuidSchema,
  amount: amountSchema,
  reference: referenceSchema,
  metadata: metadataSchema
});

export const transferWalletSchema = z.object({
  senderUserId: uuidSchema,
  receiverUserId: uuidSchema,
  amount: amountSchema,
  reference: referenceSchema,
  metadata: metadataSchema
});

export const walletMutationResponseSchema = z.object({
  walletId: uuidSchema,
  balance: z.string(),
  transactionId: uuidSchema,
  reference: referenceSchema
});

export const transferResponseSchema = z.object({
  transferId: uuidSchema,
  reference: referenceSchema,
  senderWalletId: uuidSchema,
  receiverWalletId: uuidSchema,
  senderBalance: z.string(),
  receiverBalance: z.string()
});
