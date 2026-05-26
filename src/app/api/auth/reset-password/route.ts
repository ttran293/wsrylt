import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { consumeResetToken, verifyResetToken } from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    const { token, password } = parsed.data;

    await connectDB();

    const userId = await verifyResetToken(token);
    if (!userId) {
      return Response.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );

    if (!updatedUser) {
      return Response.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    await consumeResetToken(token);

    return Response.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json(
      { error: "Could not reset password. Please try again." },
      { status: 500 },
    );
  }
}
