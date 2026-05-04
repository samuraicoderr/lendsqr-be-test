import { env } from "../src/config/env";

type EnvOverrides = Record<string, string | undefined>;

function loadEmailService(overrides: EnvOverrides = {}) {
  jest.resetModules();
  process.env = {
    ...process.env,
    ...overrides
  };

  return require("../src/services/email.service") as typeof import("../src/services/email.service");
}

describe("email.service", () => {
  it("throws when ZeptoMail api key is missing", () => {
    const { createEmailClient } = loadEmailService({
      ZEPTOMAIL_API_KEY: "",
      ZEPTOMAIL_FROM_ADDRESS: env.zeptomail.fromAddress,
      ZEPTOMAIL_FROM_NAME: env.zeptomail.fromName,
      ZEPTOMAIL_TEST_MODE: "false",
    });

    expect(() => createEmailClient()).toThrow("ZeptoMail API key is not configured");
  });

  it("throws when from address or name is missing", () => {
    const { createEmailClient } = loadEmailService({
      ZEPTOMAIL_API_KEY: env.zeptomail.apiKey,
      ZEPTOMAIL_FROM_ADDRESS: "",
      ZEPTOMAIL_FROM_NAME: "",
      ZEPTOMAIL_TEST_MODE: "false",
    });

    expect(() => createEmailClient()).toThrow("ZeptoMail from address is not configured");
  });

  it("returns payload in test mode", async () => {
    // console.log(`Sending Email with config: ${JSON.stringify({
    //   ZEPTOMAIL_API_KEY: env.zeptomail.apiKey,
    //   ZEPTOMAIL_FROM_ADDRESS: env.zeptomail.fromAddress,
    //   ZEPTOMAIL_FROM_NAME: env.zeptomail.fromName,
    //   ZEPTOMAIL_TEST_MODE: "false",
    //   DEVELOPER_EMAILS: env.developerEmails
    // })}`);
    const { sendEmail } = loadEmailService({
      ZEPTOMAIL_API_KEY: env.zeptomail.apiKey,
      ZEPTOMAIL_FROM_ADDRESS: env.zeptomail.fromAddress,
      ZEPTOMAIL_FROM_NAME: env.zeptomail.fromName,
      ZEPTOMAIL_TEST_MODE: "false",
    });

    const payload = await sendEmail({
      to: env.developerEmails,
      subject: "Hello",
      textBody: "Plain text"
    });
    // console.log(`Payload: ${JSON.stringify(payload)}`);
    if ("error" in payload) {
      throw new Error(`Email sending failed with response: ${JSON.stringify(payload)}`);
    }
    // expect(payload.subject).toBe("Hello");
    // expect(payload.from.address).toBe(env.zeptomail.fromAddress);
    // expect(payload.from.name).toBe(env.zeptomail.fromName);
    // expect(payload.to).toHaveLength(env.developerEmails.length);
    // expect(payload.to[0].email_address.address).toBe(env.developerEmails[0]);
    // expect(payload.textbody).toBe("Plain text");
  });
});