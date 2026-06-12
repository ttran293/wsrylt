import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VisitEvent } from "@/lib/models/VisitEvent";
import { VisitorSession } from "@/lib/models/VisitorSession";
import type { VisitorDailyStat, VisitorStatsPublic } from "@/types";

const VISITOR_COOKIE_NAME = "music_blog_visitor";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const ONLINE_WINDOW_MS = 90 * 1000;
const VISITOR_ID_PATTERN = /^[a-f0-9-]{36}$/i;

interface DailyVisitAggregate {
  date: string;
  visits: number;
  visitors: number;
}

interface HeartbeatOptions {
  path: string;
  recordPageview: boolean;
}

export interface VisitorHeartbeatResult {
  stats: VisitorStatsPublic;
  visitorId: string;
  shouldSetCookie: boolean;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return "/";
  }
  return trimmed.slice(0, 300);
}

function getVisitorId(request: NextRequest): {
  visitorId: string;
  shouldSetCookie: boolean;
} {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value;

  if (existing && VISITOR_ID_PATTERN.test(existing)) {
    return { visitorId: existing, shouldSetCookie: false };
  }

  return { visitorId: randomUUID(), shouldSetCookie: true };
}

function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId).digest("hex");
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyLast7Days(now: Date): VisitorDailyStat[] {
  const today = startOfUtcDay(now);
  const days: VisitorDailyStat[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    days.push({ date: getDateKey(date), visits: 0, visitors: 0 });
  }

  return days;
}

export function setVisitorCookie(response: NextResponse, visitorId: string) {
  response.cookies.set({
    name: VISITOR_COOKIE_NAME,
    value: visitorId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
}

export async function getVisitorStats(now = new Date()): Promise<VisitorStatsPublic> {
  await connectDB();

  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const todayStart = startOfUtcDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(todayStart.getUTCDate() - 6);

  const [online, todayVisits, totalVisits, dailyVisits] = await Promise.all([
    VisitorSession.countDocuments({ lastSeenAt: { $gte: onlineSince } }),
    VisitEvent.countDocuments({ createdAt: { $gte: todayStart } }),
    VisitEvent.countDocuments({}),
    VisitEvent.aggregate<DailyVisitAggregate>([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              date: "$createdAt",
              format: "%Y-%m-%d",
              timezone: "UTC",
            },
          },
          visits: { $sum: 1 },
          visitorHashes: { $addToSet: "$visitorHash" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          visits: 1,
          visitors: { $size: "$visitorHashes" },
        },
      },
      { $sort: { date: 1 } },
    ]),
  ]);

  const dailyByDate = new Map(dailyVisits.map((day) => [day.date, day]));
  const last7Days = emptyLast7Days(now).map((day) => dailyByDate.get(day.date) ?? day);

  return {
    online,
    todayVisits,
    totalVisits,
    last7Days,
  };
}

export async function recordVisitorHeartbeat(
  request: NextRequest,
  options: HeartbeatOptions,
): Promise<VisitorHeartbeatResult> {
  const now = new Date();
  const path = normalizePath(options.path);
  const { visitorId, shouldSetCookie } = getVisitorId(request);
  const visitorHash = hashVisitorId(visitorId);

  await connectDB();
  await VisitorSession.updateOne(
    { visitorHash },
    {
      $set: { lastSeenAt: now, lastPath: path },
      $setOnInsert: { firstSeenAt: now },
    },
    { upsert: true },
  );

  if (options.recordPageview) {
    await VisitEvent.create({
      visitorHash,
      path,
      createdAt: now,
    });
  }

  return {
    stats: await getVisitorStats(now),
    visitorId,
    shouldSetCookie,
  };
}
