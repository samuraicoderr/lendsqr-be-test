import {
  renderLoginSuccessEmail,
  renderTransferReceivedEmail,
  renderVerificationEmail,
  renderWalletFundedEmail,
  renderWalletWithdrawnEmail
} from "../src/email_templates";

describe("email templates", () => {
  it("renders verification email with Handlebars variables", () => {
    const html = renderVerificationEmail({
      firstName: "Ada",
      verificationUrl: "https://example.com/api/v1/auth/verify?token=abc123"
    });

    expect(html).toContain("Welcome, Ada");
    expect(html).toContain("https://example.com/api/v1/auth/verify?token=abc123");
    expect(html).not.toContain("{{FIRST_NAME}}");
    expect(html).not.toContain("{{VERIFICATION_URL}}");
  });

  it("preserves existing raw substitution behavior", () => {
    const html = renderVerificationEmail({
      firstName: "<script>alert('x')</script>",
      verificationUrl: "https://example.com/verify?token=<token>"
    });

    expect(html).toContain("<script>alert('x')</script>");
    expect(html).toContain("https://example.com/verify?token=<token>");
  });

  it("renders wallet and login notification templates", () => {
    expect(
      renderWalletFundedEmail({
        firstName: "Ada",
        amount: "100.00",
        balance: "250.00"
      })
    ).toContain("Your wallet has been funded with NGN 100.00");

    expect(
      renderWalletWithdrawnEmail({
        firstName: "Ada",
        amount: "50.00",
        balance: "200.00"
      })
    ).toContain("You withdrew NGN 50.00");

    expect(
      renderTransferReceivedEmail({
        firstName: "Ada",
        senderName: "Grace Hopper",
        amount: "75.00",
        balance: "275.00"
      })
    ).toContain("Grace Hopper sent you NGN 75.00");

    expect(renderLoginSuccessEmail({ firstName: "Ada" })).toContain("signed in successfully");
  });
});
