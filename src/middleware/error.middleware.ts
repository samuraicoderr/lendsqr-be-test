import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "not_found",
    message: "Route not found"
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred"
  });
}
