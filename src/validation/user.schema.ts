import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email()
});

export const createUserResponseSchema = z.object({
  id: uuidSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  wallet: z.object({
    id: uuidSchema,
    balance: z.string(),
    currency: z.string()
  })
});
