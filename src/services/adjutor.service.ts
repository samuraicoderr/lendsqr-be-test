import { ApiError } from "../utils/errors";
import { AdjutorKarmaData, fetchKarma } from "../clients/adjutor.client";

export type KarmaCheckResult = {
  isBlacklisted: boolean;
  data?: AdjutorKarmaData | null;
  message?: string;
};

function isSuccessStatus(responseData: any): boolean {
    if (Object.keys(responseData).length === 0) {
        return true;
    }
  
    if (responseData.status && [200, "success"].includes(responseData.status)) {
        return true;
    }
  
    return false;
}

export async function checkEmailBlacklist(email: string): Promise<KarmaCheckResult> {
  try {
    const response = await fetchKarma(email);

    if (!isSuccessStatus(response)) {
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
