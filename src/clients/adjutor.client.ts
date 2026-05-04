import axios from "axios";
import { env } from "../config/env";

export type AdjutorKarmaData = {
  karma_identity: string;
  amount_in_contention: string;
  reason: string | null;
  default_date: string | null;
  karma_type: { karma: string } | null;
  karma_identity_type: { identity_type: string } | null;
  reporting_entity: { name: string; email: string } | null;
};

export type AdjutorKarmaResponse = {
  status: string;
  message: string;
  data?: AdjutorKarmaData | null;
  meta?: {
    cost?: number;
    balance?: number;
  };
};

const adjutorClient = axios.create({
  baseURL: env.adjutor.baseUrl,
  timeout: env.adjutor.timeoutMs,
  headers: {
    Authorization: `Bearer ${env.adjutor.apiKey}`
  }
});

function isAdjutorResponse(payload: unknown): payload is AdjutorKarmaResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const response = payload as { status?: unknown; message?: unknown };
  return typeof response.status === "string" && typeof response.message === "string";
}

export async function fetchKarma(identity: string): Promise<AdjutorKarmaResponse> {
  const response = await adjutorClient.get(
    `/v2/verification/karma/${encodeURIComponent(identity)}`
  );

  if (!isAdjutorResponse(response.data)) {
    throw new Error("Invalid Adjutor response");
  }

  return response.data;
}
