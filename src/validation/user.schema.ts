import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const userResponseSchema = z.object({
  id: uuidSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  isEmailVerified: z.boolean(),
  isTwoFactorEnabled: z.boolean(),
  isAdmin: z.boolean()
});

export const usersResponseSchema = z.array(userResponseSchema);
