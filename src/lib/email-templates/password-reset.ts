export function passwordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: sans-serif; line-height: 1.5; color: #111;">
    <p>We received a request to reset your password.</p>
    <p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 4px;">
        Reset password
      </a>
    </p>
    <p>Or copy this link into your browser:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
    <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
  </body>
</html>
`.trim();
}

export function passwordResetEmailText(resetUrl: string): string {
  return [
    "We received a request to reset your password.",
    "",
    `Reset your password: ${resetUrl}`,
    "",
    "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
  ].join("\n");
}
