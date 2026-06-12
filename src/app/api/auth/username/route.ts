import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { usernameSchema } from "@/lib/validation/username";

export async function GET(request: NextRequest) {
  try {
    const parsed = usernameSchema.safeParse(
      request.nextUrl.searchParams.get("name") ?? "",
    );

    if (!parsed.success) {
      return Response.json({
        valid: false,
        error: parsed.error.issues[0]?.message ?? "Username is invalid.",
      });
    }

    await connectDB();

    const existingUser = await User.exists({ name: parsed.data });
    if (existingUser) {
      return Response.json({
        valid: false,
        error: "Username already exists. Choose a different username.",
      });
    }

    return Response.json({ valid: true });
  } catch (error) {
    console.error("Username validation error:", error);
    return Response.json(
      { valid: false, error: "Could not check username." },
      { status: 500 },
    );
  }
}
