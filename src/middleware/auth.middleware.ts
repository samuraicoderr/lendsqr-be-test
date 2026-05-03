import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/errors";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header) {
    throw ApiError.unauthorized("Authorization header is required");
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || token !== env.apiToken) {
    throw ApiError.unauthorized("Invalid API token");
  }

  next();
}
