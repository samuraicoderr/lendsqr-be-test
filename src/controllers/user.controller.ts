import { Request, Response } from "express";
import { z } from "zod";
import { createUser } from "../services/user.service";
import { ApiError } from "../utils/errors";

const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email()
});

export async function createUserHandler(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request body", parsed.error.flatten());
  }

  const result = await createUser(parsed.data);

  res.status(201).json({
    data: result
  });
}
