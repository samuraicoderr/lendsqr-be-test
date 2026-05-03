import { Request, Response } from "express";
import { createUser } from "../services/user.service";
import { ApiError } from "../utils/errors";
import { createUserSchema } from "../validation/user.schema";

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
