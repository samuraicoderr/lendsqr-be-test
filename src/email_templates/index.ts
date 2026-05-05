import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

type TemplateParams = Record<string, unknown>;

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

function loadTemplate(fileName: string): Handlebars.TemplateDelegate {
  if (templateCache.has(fileName)) {
    return templateCache.get(fileName) as Handlebars.TemplateDelegate;
  }

  const filePath = path.resolve(process.cwd(), "src", "email_templates", fileName);
  const content = fs.readFileSync(filePath, "utf8");
  const template = Handlebars.compile(content, { noEscape: true });
  templateCache.set(fileName, template);
  return template;
}

function renderTemplate(fileName: string, params: TemplateParams): string {
  return loadTemplate(fileName)(params);
}

export function renderVerificationEmail(params: {
  firstName: string;
  verificationUrl: string;
}): string {
  return renderTemplate("verification.html", {
    FIRST_NAME: params.firstName,
    VERIFICATION_URL: params.verificationUrl
  });
}

export function renderWalletFundedEmail(params: {
  firstName: string;
  amount: string;
  balance: string;
}): string {
  return renderTemplate("wallet-funded.html", {
    FIRST_NAME: params.firstName,
    AMOUNT: params.amount,
    BALANCE: params.balance
  });
}

export function renderWalletWithdrawnEmail(params: {
  firstName: string;
  amount: string;
  balance: string;
}): string {
  return renderTemplate("wallet-withdrawn.html", {
    FIRST_NAME: params.firstName,
    AMOUNT: params.amount,
    BALANCE: params.balance
  });
}

export function renderTransferReceivedEmail(params: {
  firstName: string;
  senderName: string;
  amount: string;
  balance: string;
}): string {
  return renderTemplate("transfer-received.html", {
    FIRST_NAME: params.firstName,
    SENDER_NAME: params.senderName,
    AMOUNT: params.amount,
    BALANCE: params.balance
  });
}

export function renderLoginSuccessEmail(params: {
  firstName: string;
}): string {
  return renderTemplate("login-success.html", {
    FIRST_NAME: params.firstName
  });
}
