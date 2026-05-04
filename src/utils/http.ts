import { Request } from "express";
import { env } from "../config/env";

export function resolveBaseUrl(req: Request): string {
  if (env.backendConfig.baseURL) {
    return env.backendConfig.baseURL.replace(/\/$/, "");
  }

  const host = req.get("host");
  if (!host) {
    return "";
  }

  return `${req.protocol}://${host}`;
}
