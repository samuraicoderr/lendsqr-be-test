import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { resolveUserFromToken } from "../services/auth.service";

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = await resolveUserFromToken(token);
  } catch (error) {
    return next();
  }

  return next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    throw ApiError.unauthorized("Authorization header is required");
  }

  req.user = await resolveUserFromToken(token);
  return next();
}
