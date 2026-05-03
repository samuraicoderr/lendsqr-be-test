import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const amountSchema = z.union([z.string(), z.number()]);
export const referenceSchema = z.string().min(6).max(100);
export const metadataSchema = z.record(z.any()).optional();

export const userIdParamSchema = z.object({
  userId: uuidSchema
});
