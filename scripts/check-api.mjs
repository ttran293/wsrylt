/**
 * Quick smoke test for API routes.
 *
 * Usage:
 *   npm run dev          (in another terminal)
 *   npm run api:check
 *
 * Optional: API_BASE_URL=http://localhost:3001 npm run api:check
 */

const BASE = process.env.API_BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function summarize(data) {
  if (Array.isArray(data)) {
    if (data[0]?.videoId) return `(${data.length} results)`;
    return `(${data.length} posts)`;
  }
  if (data?.user === null) return "(guest session)";
  if (data?.user?.name && !data?.posts) return `(session: ${data.user.name})`;
  if (data?.posts && data?.user) {
    return `(user: ${data.user.name}, ${data.posts.length} posts)`;
  }
  if (data?.error) return `(${data.error})`;
  return "";
}

async function check(name, path, options = {}) {
  const url = `${BASE}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    let data = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else if (!response.ok) {
      const text = await response.text();
      console.log(
        `FAIL  ${name}  →  ${response.status} (${text.slice(0, 40).replace(/\s+/g, " ")}…)`,
      );
      failed++;
      return { ok: false, data: null };
    }

    const detail = `${response.status} ${summarize(data)}`.trim();
    const ok = response.ok;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  →  ${detail}`);
    if (ok) passed++;
    else failed++;
    return { ok, data };
  } catch (error) {
    console.log(`FAIL  ${name}  →  ${error.message}`);
    failed++;
    return { ok: false, data: null };
  }
}

console.log(`Checking API at ${BASE}\n`);

const postsResult = await check("GET /api/posts", "/api/posts");
await check("GET /api/auth/session", "/api/auth/session");

if (postsResult.ok && Array.isArray(postsResult.data) && postsResult.data.length > 0) {
  const post = postsResult.data[0];
  await check("GET /api/posts/[id]", `/api/posts/${post._id}`);
  if (post.creator?._id) {
    await check("GET /api/users/[id]", `/api/users/${post.creator._id}`);
  }
} else {
  console.log("SKIP  GET /api/posts/[id]  →  no posts in database");
  console.log("SKIP  GET /api/users/[id]  →  no posts in database");
}

const youtube = await check(
  "GET /api/youtube/search?q=music",
  "/api/youtube/search?q=music",
);
if (!youtube.ok) {
  console.log("      (YouTube search fails with 503 if YOUTUBE_API_KEY is not set)");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
