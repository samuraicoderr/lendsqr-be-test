import { z } from "zod";

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional()
});

export function apiResponseSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    data: schema
  });
}
