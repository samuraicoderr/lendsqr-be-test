import axios from "axios";
import { env } from "../config/env";
import { ApiError } from "../utils/errors";

const adjutorClient = axios.create({
  baseURL: env.adjutor.baseUrl,
  timeout: env.adjutor.timeoutMs,
  headers: {
    Authorization: `Bearer ${env.adjutor.apiKey}`
  }
});

function resolveBlacklistStatus(payload: unknown): boolean {
  const data = payload as {
    data?: {
      karma?: { status?: string };
      status?: string;
      blacklisted?: boolean;
    };
  };

  const rawStatus = data?.data?.karma?.status ?? data?.data?.status;
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.toLowerCase();
    if (normalized === "blacklisted" || normalized === "bad" || normalized === "blocked") {
      return true;
    }
  }

  if (data?.data?.blacklisted === true) {
    return true;
  }

  return false;
}

export async function isBlacklisted(email: string): Promise<boolean> {
  try {
    const response = await adjutorClient.get(
      `/v1/verification/karma/${encodeURIComponent(email)}`
    );
    return resolveBlacklistStatus(response.data);
  } catch (error) {
    throw ApiError.serviceUnavailable("Blacklist verification failed");
  }
}
