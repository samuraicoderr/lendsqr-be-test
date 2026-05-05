import { z } from "zod";
import { amountSchema, uuidSchema } from "./common.schema";

export const accountNumberSchema = z.string().regex(/^\d{11}$/);

export const walletResponseSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  accountNumber: accountNumberSchema,
  balance: z.string(),
  currency: z.string()
});

export const fundWalletSchema = z
  .object({
    amount: amountSchema
  })
  .strict();

export const withdrawWalletSchema = z
  .object({
    amount: amountSchema
  })
  .strict();

export const transferWalletSchema = z
  .object({
    receiverAccountNumber: accountNumberSchema.optional(),
    receiverUserId: uuidSchema.optional(),
    amount: amountSchema
  })
  .strict()
  .refine(
    (data) => Boolean(data.receiverAccountNumber) !== Boolean(data.receiverUserId),
    "Set either receiverAccountNumber or receiverUserId"
  );

export const walletMutationResponseSchema = z.object({
  walletId: uuidSchema,
  balance: z.string(),
  transactionId: uuidSchema
});

export const transferResponseSchema = z.object({
  transferId: uuidSchema,
  senderWalletId: uuidSchema,
  receiverWalletId: uuidSchema,
  senderBalance: z.string(),
  receiverBalance: z.string()
});
