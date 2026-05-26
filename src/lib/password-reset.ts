import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";
import { PasswordResetToken } from "@/lib/models/PasswordResetToken";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createResetToken(
  userId: mongoose.Types.ObjectId | string,
): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await PasswordResetToken.deleteMany({ userId });

  await PasswordResetToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export async function verifyResetToken(
  rawToken: string,
): Promise<mongoose.Types.ObjectId | null> {
  const tokenHash = hashToken(rawToken);
  const record = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  return record?.userId ?? null;
}

export async function consumeResetToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await PasswordResetToken.deleteOne({ tokenHash });
}
