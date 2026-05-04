import { ApiError } from "../utils/errors";
import { env } from "../config/env";
import { Config, Email, MimeType, bytesToBase64 } from "../clients/zeptomail.client";

export type SendEmailInput = {
  to: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  replyTo?: Array<[string, string]>;
  attachments?: Array<[string, MimeType, string]>;
  clientReference?: string;
};

export type SendDeveloperEmailInput = Omit<SendEmailInput, "to">;

export function createEmailClient() {
  if (!env.zeptomail.apiKey) {
    throw ApiError.serviceUnavailable("ZeptoMail API key is not configured");
  }

  if (!env.zeptomail.fromAddress || !env.zeptomail.fromName) {
    throw ApiError.serviceUnavailable("ZeptoMail from address is not configured");
  }

  const config = new Config(env.zeptomail.apiKey, {}, env.zeptomail.testMode);

  if (env.zeptomail.baseUrl) {
    config.zeptoUrl = env.zeptomail.baseUrl;
  }

  return new Email(config, env.zeptomail.bounceAddress || undefined);
}

export async function sendEmail(input: SendEmailInput) {
  const client = createEmailClient();

  return client.send({
    from: env.zeptomail.fromAddress,
    fromName: env.zeptomail.fromName,
    to: input.to,
    subject: input.subject,
    textBody: input.textBody,
    htmlBody: input.htmlBody,
    replyTo: input.replyTo,
    attachments: input.attachments,
    clientReference: input.clientReference
  });
}

export async function sendEmailToDevelopers(input: SendDeveloperEmailInput) {
  const recipients = env.developerEmails;
  if (!recipients.length) {
    throw ApiError.serviceUnavailable("Developer emails are not configured");
  }

  return sendEmail({
    to: recipients,
    subject: input.subject,
    textBody: input.textBody,
    htmlBody: input.htmlBody,
    replyTo: input.replyTo,
    attachments: input.attachments,
    clientReference: input.clientReference
  });
}
