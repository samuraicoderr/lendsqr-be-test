import dotenv from "dotenv";

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

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const normalized = value.toLowerCase().trim();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean environment variable: ${key}`);
}

export const env = {
  port: getNumberEnv("PORT", 3000),
  apiToken: getEnv("API_TOKEN", "FAKE-AUTH-TOKEN"),
  docs: {
    uiEnabled: getBooleanEnv("DOCS_UI_ENABLED", true)
  },
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
