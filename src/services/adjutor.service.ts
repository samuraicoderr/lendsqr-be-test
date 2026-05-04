import { ApiError } from "../utils/errors";
import { AdjutorKarmaData, fetchKarma } from "../clients/adjutor.client";

export type KarmaCheckResult = {
  isBlacklisted: boolean;
  data?: AdjutorKarmaData | null;
  message?: string;
};

function isSuccessStatus(status: string): boolean {
  return status.toLowerCase() === "success";
}

export async function checkEmailBlacklist(email: string): Promise<KarmaCheckResult> {
  try {
    const response = await fetchKarma(email);

    if (!isSuccessStatus(response.status)) {
      throw ApiError.forbidden("Blacklist verification failed");
    }

    const hasKarma = Boolean(response.data);

    return {
      isBlacklisted: hasKarma,
      data: response.data ?? null,
      message: response.message
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.forbidden("Blacklist verification failed");
  }
}
