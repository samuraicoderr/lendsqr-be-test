import {
  renderLoginSuccessEmail,
  renderTransferReceivedEmail,
  renderWalletFundedEmail,
  renderWalletWithdrawnEmail
} from "../email_templates";
import { sendEmail } from "./email.service";

type WalletNotificationInput = {
  email: string;
  firstName: string;
  amount: string;
  balance: string;
};

type TransferReceivedNotificationInput = WalletNotificationInput & {
  senderName: string;
};

async function sendNotification(input: {
  email: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) {
  try {
    await sendEmail({
      to: [input.email],
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody
    });
  } catch (error) {
    console.error("[notifications] failed to send email", error);
  }
}

export async function sendWalletFundedNotification(input: WalletNotificationInput) {
  await sendNotification({
    email: input.email,
    subject: "Wallet funded",
    htmlBody: renderWalletFundedEmail(input),
    textBody: `Your wallet has been funded with NGN ${input.amount}. Your new balance is NGN ${input.balance}.`
  });
}

export async function sendWalletWithdrawnNotification(input: WalletNotificationInput) {
  await sendNotification({
    email: input.email,
    subject: "Withdrawal completed",
    htmlBody: renderWalletWithdrawnEmail(input),
    textBody: `You withdrew NGN ${input.amount}. Your new balance is NGN ${input.balance}.`
  });
}

export async function sendTransferReceivedNotification(input: TransferReceivedNotificationInput) {
  await sendNotification({
    email: input.email,
    subject: "Transfer received",
    htmlBody: renderTransferReceivedEmail(input),
    textBody: `${input.senderName} sent you NGN ${input.amount}. Your new balance is NGN ${input.balance}.`
  });
}

export async function sendLoginSuccessNotification(input: {
  email: string;
  firstName: string;
}) {
  await sendNotification({
    email: input.email,
    subject: "Successful login",
    htmlBody: renderLoginSuccessEmail(input),
    textBody: "Your account was just signed in successfully."
  });
}
