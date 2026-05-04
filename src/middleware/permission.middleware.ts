import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";

export function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  if (!req.user.isEmailVerified) {
    throw ApiError.forbidden("Email is not verified");
  }

  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  if (!req.user.isAdmin) {
    throw ApiError.forbidden("Admin access required");
  }

  return next();
}
