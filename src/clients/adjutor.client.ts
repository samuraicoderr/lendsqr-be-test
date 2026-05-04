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


export async function fetchKarma(identity: string): Promise<AdjutorKarmaResponse> {
   // I didn't get it at first but this endpoint can recieve no data with a 200. I'm guessing in that case the user doesn't exist on Lendsqr's DB. Omor life is not easy sha.
  const response = await adjutorClient.get(
    `/v2/verification/karma/${encodeURIComponent(identity)}`
  );
  return response.data;
}
