export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, "bad_request", message, details);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(401, "unauthorized", message);
  }

  static forbidden(message: string): ApiError {
    return new ApiError(403, "forbidden", message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, "not_found", message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, "conflict", message);
  }

  static serviceUnavailable(message: string): ApiError {
    return new ApiError(503, "service_unavailable", message);
  }
}
