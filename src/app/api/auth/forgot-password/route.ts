import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required."),
});

const successMessage =
  "If an account exists for that email, a reset link has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    const { email } = parsed.data;

    await connectDB();
    const user = await User.findOne({ email });

    if (user) {
      const token = await createResetToken(user._id);
      try {
        await sendPasswordResetEmail(email, token);
      } catch (emailError) {
        console.error("Forgot password email error:", emailError);
      }
    }

    return Response.json({ message: successMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { error: "Could not process password reset request." },
      { status: 500 },
    );
  }
}
