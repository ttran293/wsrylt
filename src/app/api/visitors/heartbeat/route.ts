import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  recordVisitorHeartbeat,
  setVisitorCookie,
} from "@/lib/visitors";

export const dynamic = "force-dynamic";

const heartbeatSchema = z.object({
  path: z.string().min(1).max(300).optional(),
  recordPageview: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = heartbeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid visitor payload." }, { status: 400 });
    }

    const result = await recordVisitorHeartbeat(request, {
      path: parsed.data.path ?? "/",
      recordPageview: parsed.data.recordPageview ?? false,
    });
    const response = NextResponse.json(result.stats);

    if (result.shouldSetCookie) {
      setVisitorCookie(response, result.visitorId);
    }

    return response;
  } catch (error) {
    console.error("Visitor heartbeat error:", error);
    return NextResponse.json(
      { error: "Could not update visitor stats." },
      { status: 500 },
    );
  }
}
