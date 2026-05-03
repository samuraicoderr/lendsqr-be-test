import dotenv from "dotenv";
import { get } from "node:http";

dotenv.config();


function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    return defaultValue || "";
  }
  return value;
}

function mustGetEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }
  return parsed;
}

export const env = {
  port: getNumberEnv("PORT", 3000),
  apiToken: getEnv("API_TOKEN", "FAKE-AUTH-TOKEN"),
  db: {
    host: mustGetEnv("DB_HOST"),
    port: getNumberEnv("DB_PORT", 3306),
    user: mustGetEnv("DB_USER"),
    password: mustGetEnv("DB_PASSWORD"),
    database: mustGetEnv("DB_NAME"),
    poolMax: getNumberEnv("DB_POOL_MAX", 10)
  },
  adjutor: {
    baseUrl: mustGetEnv("ADJUTOR_BASE_URL"),
    apiKey: mustGetEnv("ADJUTOR_API_KEY"),
    timeoutMs: getNumberEnv("ADJUTOR_TIMEOUT_MS", 5000)
  }
};
