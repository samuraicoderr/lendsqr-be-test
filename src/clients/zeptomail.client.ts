import { Buffer } from "buffer";

export const UNSUPPORTED_ATTACHMENT_FORMATS = [
  "ade", "adp", "bat", "chm", "cmd", "com", "cpl", "exe", "hta", "ins", "isp", "js", "jse",
  "lib", "lnk", "mde", "msc", "msp", "mst", "pif", "scr", "sct", "shb", "sys", "vb", "vbe",
  "vbs", "vxd", "wsc", "wsf", "wsh", "app", "asp", "bas", "cer", "cnt", "crt", "csh", "der",
  "fxp", "gadget", "hlp", "hpj", "inf", "ksh", "mad", "maf", "mag", "mam", "maq", "mar",
  "mas", "mat", "mau", "mav", "maw", "mda", "mdb", "mdt", "mdw", "mdz", "msh", "msh1",
  "msh2", "msh1xml", "msh2xml", "msi", "msp", "ops", "osd", "pcd", "plg", "prf", "prg",
  "pst", "reg", "scf", "shs", "ps1", "ps1xml", "ps2", "ps2xml", "psc1", "psc2", "tmp",
  "url", "vbp", "vsmacros", "vsw", "ws", "xnk"
];

export class MimeTypeError extends TypeError {}

export class ZeptoMailResponseError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, requestId?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

type ZeptoMailSuccess = {
  data: Array<{ code: string; additional_info: unknown[]; message: string }>;
  message: string;
  request_id: string;
  object: "email";
};

type ZeptoMailPayload = {
  subject: string;
  from: { address: string; name: string };
  to: { email_address: { address: string; name: string } }[];
  bounce_address?: string;
  reply_to?: { address: string; name: string }[];
  textbody?: string;
  htmlbody?: string;
  client_reference?: string;
  attachments?: { content: string; mime_type: string; name: string }[];
};

type ZeptoMailError = {
  error: {
    code: string;
    details?: Array<{ code: string; message: string }>;
    message: string;
    request_id?: string;
  };
};

function isZeptoMailError(payload: unknown): payload is ZeptoMailError {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const maybe = payload as { error?: { code?: string; message?: string } };
  return Boolean(maybe.error && maybe.error.code && maybe.error.message);
}

function isZeptoMailSuccess(payload: unknown): payload is ZeptoMailSuccess {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const maybe = payload as { object?: string; data?: unknown };
  return maybe.object === "email" && Array.isArray(maybe.data);
}

export class MimeType {
  format: string;
  klass: string;

  constructor(format = "", klass = "") {
    this.format = format;
    this.klass = klass;
  }

  isValid(): boolean {
    return !UNSUPPORTED_ATTACHMENT_FORMATS.includes(this.format);
  }

  get value(): string {
    return `${this.klass}/${this.format}`;
  }

  toString(): string {
    return `<MimeType: format=${this.format}, klass=${this.klass}>`;
  }

  isTruthy(): boolean {
    return Boolean(this.format && this.klass);
  }
}

export class Config {
  apiKey: string;
  headers: Record<string, string>;
  zeptoUrl = "https://api.zeptomail.com/v1.1/email";
  _testMode: boolean;

  constructor(apiKey: string, headers: Record<string, string> = {}, testMode = false) {
    this.apiKey = apiKey;
    this.headers = headers;
    this._testMode = testMode;

    this.updateHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-enczapikey ${apiKey}`
    });
  }

  updateHeaders(newHeaders: Record<string, string>, force = false) {
    for (const [key, value] of Object.entries(newHeaders)) {
      if (force) {
        this.headers[key] = value;
      } else {
        if (!this.headers[key]) {
          this.headers[key] = value;
        }
      }
    }
  }
}

type ReplyTo = [string, string];
type Attachment = [string, MimeType, string];

export class Email {
  static DEFAULT_MIME_TYPE = new MimeType("text", "plain");

  config: Config;
  bounceAddress?: string;

  constructor(config: Config, bounceAddress?: string) {
    this.config = config;
    this.bounceAddress = bounceAddress;
  }

  private checkMimeType(mimeType: MimeType): MimeType {
    if (!mimeType.isValid()) {
      throw new MimeTypeError(`Unsupported mime_type ${mimeType}`);
    }
    return mimeType;
  }

  async send(params: {
    from: string;
    fromName: string;
    to: string[];
    subject: string;
    textBody?: string;
    htmlBody?: string;
    replyTo?: ReplyTo[];
    attachments?: Attachment[];
    clientReference?: string;
  }): Promise<ZeptoMailSuccess | ZeptoMailPayload> {
    const {
      from,
      fromName,
      to,
      subject,
      textBody,
      htmlBody,
      replyTo = [],
      attachments = [],
      clientReference
    } = params;

    const payload = this.buildPayload({
      from,
      fromName,
      to,
      subject,
      textBody,
      htmlBody,
      replyTo,
      attachments,
      clientReference
    });

    if (this.config._testMode) {
      return payload;
    }

    const response = await fetch(this.config.zeptoUrl, {
      method: "POST",
      headers: this.config.headers,
      body: JSON.stringify(payload)
    });

    const parsed = await this.parseResponse(response);

    if (!response.ok) {
      if (isZeptoMailError(parsed)) {
        throw new ZeptoMailResponseError(
          parsed.error.message,
          response.status,
          parsed.error.code,
          parsed.error.request_id,
          parsed.error.details
        );
      }
      throw new ZeptoMailResponseError("ZeptoMail request failed", response.status, undefined, undefined, parsed);
    }

    if (isZeptoMailError(parsed)) {
      throw new ZeptoMailResponseError(
        parsed.error.message,
        response.status,
        parsed.error.code,
        parsed.error.request_id,
        parsed.error.details
      );
    }

    if (!isZeptoMailSuccess(parsed)) {
      throw new ZeptoMailResponseError("Unexpected ZeptoMail response", response.status, undefined, undefined, parsed);
    }

    return parsed;
  }

  private buildPayload(params: {
    from: string;
    fromName: string;
    to: string[];
    subject: string;
    textBody?: string;
    htmlBody?: string;
    replyTo?: ReplyTo[];
    attachments?: Attachment[];
    clientReference?: string;
  }) {
    const {
      from,
      fromName,
      to,
      subject,
      textBody,
      htmlBody,
      replyTo = [],
      attachments = [],
      clientReference
    } = params;

    const payload: ZeptoMailPayload = {
      subject,
      from: {
        address: from,
        name: fromName
      },
      to: to.map((email, index) => ({
        email_address: {
          address: email,
          name: `TO_${index}`
        }
      }))
    };

    if (this.bounceAddress) payload.bounce_address = this.bounceAddress;
    if (replyTo.length) {
      payload.reply_to = replyTo.map(([email, name]) => ({
        address: email,
        name
      }));
    }
    if (textBody) payload.textbody = textBody;
    if (htmlBody) payload.htmlbody = htmlBody;
    if (clientReference) payload.client_reference = clientReference;

    if (attachments.length) {
      payload.attachments = attachments.map(([content, mimeType, name]) => ({
        content,
        mime_type: (this.checkMimeType(mimeType) || Email.DEFAULT_MIME_TYPE).value,
        name
      }));
    }

    return payload;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      return { raw: text, parseError: String(error) };
    }
  }
}

export function bytesToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
