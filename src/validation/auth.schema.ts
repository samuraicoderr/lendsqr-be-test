import { z } from "zod";
import { userResponseSchema } from "./user.schema";

export const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10)
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema
});

export const registerResponseSchema = userResponseSchema.extend({
  wallet: z.object({
    id: z.string().uuid(),
    accountNumber: z.string().regex(/^\d{11}$/),
    balance: z.string(),
    currency: z.string()
  })
});

export const resendVerificationResponseSchema = z.object({
  message: z.string()
});
