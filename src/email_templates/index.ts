import fs from "fs";
import path from "path";

const templateCache = new Map<string, string>();

function loadTemplate(fileName: string): string {
  if (templateCache.has(fileName)) {
    return templateCache.get(fileName) as string;
  }

  const filePath = path.resolve(process.cwd(), "src", "email_templates", fileName);
  const content = fs.readFileSync(filePath, "utf8");
  templateCache.set(fileName, content);
  return content;
}

export function renderVerificationEmail(params: {
  firstName: string;
  verificationUrl: string;
}): string {
  const template = loadTemplate("verification.html");
  return template
    .replace(/\{\{FIRST_NAME\}\}/g, params.firstName)
    .replace(/\{\{VERIFICATION_URL\}\}/g, params.verificationUrl);
}
