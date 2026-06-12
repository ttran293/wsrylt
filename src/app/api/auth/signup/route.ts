import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { formatISO } from "date-fns";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { passwordSchema } from "@/lib/validation/password";
import { usernameSchema } from "@/lib/validation/username";

const signupSchema = z.object({
  name: usernameSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required."),
  password: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    const { name, email, password } = parsed.data;

    await connectDB();

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return Response.json(
        { error: "Username already exists. Choose a different username." },
        { status: 422 },
      );
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return Response.json(
        { error: "Email already in use. Choose a different email." },
        { status: 422 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
      information: "",
      datejoin: formatISO(new Date()),
      posts: [],
      comments: [],
      likes: [],
    });

    return Response.json(
      {
        userId: createdUser._id.toString(),
        name: createdUser.name,
        status: "201",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Signing up failed. Please try again later." },
      { status: 500 },
    );
  }
}
