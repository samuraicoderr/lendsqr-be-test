import dotenv from "dotenv";

dotenv.config();

const isEmptyArray = (arr: unknown): arr is [] => Array.isArray(arr) && arr.length === 0;

function _getEnv(
  key: string,
  defaultValue?: string,
  asArray?: boolean,
): string | string[] {
  const value = process.env[key];
  if (!value) {
    return defaultValue || "";
  }
  if (asArray) {
    return value
      .split(",")
      .map((s) => {
        const v = s.trim();
        if (v) {
          return v;
        }
      })
      .filter((v): v is string => !!v);
  }
  return value;
}

export function getEnvAsString(key: string, defaultValue?: string): string {
    return _getEnv(key, defaultValue) as string;
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

const _DEVELOPER_EMAILS = _getEnv("DEVELOPER_EMAILS", "", true) as string[];

export const env = {
  port: getNumberEnv("PORT", 3000),
  apiToken: getEnvAsString("API_TOKEN", "FAKE-AUTH-TOKEN"),
  docs: {
    uiEnabled: getBooleanEnv("DOCS_UI_ENABLED", true),
  },
  developerEmails:
    isEmptyArray(_DEVELOPER_EMAILS.length)
      ? _DEVELOPER_EMAILS
      : ["williamusanga23@gmail.com"],
  zeptomail: {
    apiKey: getEnvAsString("ZEPTOMAIL_API_KEY"),
    fromAddress: getEnvAsString("ZEPTOMAIL_FROM_ADDRESS"),
    fromName: getEnvAsString("ZEPTOMAIL_FROM_NAME"),
    bounceAddress: getEnvAsString("ZEPTOMAIL_BOUNCE_ADDRESS"),
    baseUrl: getEnvAsString(
      "ZEPTOMAIL_BASE_URL",
      "https://api.zeptomail.com/v1.1/email",
    ),
    testMode: getBooleanEnv("ZEPTOMAIL_TEST_MODE", false),
  },
  db: {
    host: mustGetEnv("DB_HOST"),
    port: getNumberEnv("DB_PORT", 3306),
    user: mustGetEnv("DB_USER"),
    password: mustGetEnv("DB_PASSWORD"),
    database: mustGetEnv("DB_NAME"),
    poolMax: getNumberEnv("DB_POOL_MAX", 10),
  },
  adjutor: {
    baseUrl: mustGetEnv("ADJUTOR_BASE_URL"),
    apiKey: mustGetEnv("ADJUTOR_API_KEY"),
    timeoutMs: getNumberEnv("ADJUTOR_TIMEOUT_MS", 5000),
  },
};
