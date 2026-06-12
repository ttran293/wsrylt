import { NextResponse } from "next/server";
import { getVisitorStats } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getVisitorStats());
  } catch (error) {
    console.error("Visitor stats error:", error);
    return NextResponse.json(
      { error: "Could not load visitor stats." },
      { status: 500 },
    );
  }
}
