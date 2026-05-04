import { Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { getUserById, getUserProfile, listAllUsers } from "../services/user.service";
import { userIdParamSchema } from "../validation/common.schema";

export async function getMeHandler(req: Request, res: Response) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const result = await getUserProfile(req.user);
  res.status(200).json({ data: result });
}

export async function getUserByIdHandler(req: Request, res: Response) {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid user id", parsed.error.flatten());
  }

  const result = await getUserById(parsed.data.userId);
  res.status(200).json({ data: result });
}

export async function listUsersHandler(req: Request, res: Response) {
  const result = await listAllUsers();
  res.status(200).json({ data: result });
}
