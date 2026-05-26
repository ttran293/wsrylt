import { Resend } from "resend";
import { getAppUrl } from "@/lib/app-url";
import {
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "@/lib/email-templates/password-reset";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = getAppUrl();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  return { apiKey, from, appUrl };
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const { apiKey, from, appUrl } = getEmailConfig();
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your password",
    html: passwordResetEmailHtml(resetUrl),
    text: passwordResetEmailText(resetUrl),
  });

  if (error) {
    throw new Error(error.message);
  }
}
