/**
 * Seed synthetic users, posts, likes, and comments.
 *
 * Usage:
 *   npm run db:seed              (remove old seed data, then insert fresh)
 *   npm run db:seed -- --clear   (remove seed data only, no re-insert)
 *
 * Sample posts use classic tracks from Oasis, Billy Joel, and ABBA across
 * YouTube, Spotify, and SoundCloud embed URLs.
 * All seed users share password: seed123
 *
 * Seed emails use @example.com only. To test password reset, sign up at
 * /signup with your own email (Resend test mode sends to your verified address).
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import bcrypt from "bcryptjs";
import { formatISO, subDays, subHours } from "date-fns";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { resolveMediaUrl } from "../src/lib/media";
import { User } from "../src/lib/models/User";
import { MusicPost } from "../src/lib/models/MusicPost";
import { Comment } from "../src/lib/models/Comment";
import { Like } from "../src/lib/models/Like";

const SEED_PASSWORD = "seed123";

const SEED_USERS = [
  {
    name: "alex_tapes",
    email: "alex.tapes@example.com",
    information: "late-night cassette rips and piano bars",
  },
  {
    name: "mira_echo",
    email: "mira.echo@example.com",
    information: "indie pop on repeat",
  },
  {
    name: "juns_vinyl",
    email: "juns.vinyl@example.com",
    information: "jazz standards and old film scores",
  },
  {
    name: "crate_diver",
    email: "crate.diver@example.com",
    information: "digging for funk samples",
  },
  {
    name: "luna_tracks",
    email: "luna.tracks@example.com",
    information: "bedroom pop and slow Sundays",
  },
] as const;

const SEED_POSTS = [
  {
    creator: "alex_tapes",
    url: "https://www.youtube.com/watch?v=FVdjZYfDuLE",
    caption: "oasis — wonderwall. still know every word",
    tags: ["britpop", "90s", "classic"],
    daysAgo: 5,
  },
  {
    creator: "juns_vinyl",
    url: "https://open.spotify.com/track/1jEtkYYymmFGKEDLZ7ZisR",
    caption: "billy joel — piano man. dad's road trip classic",
    tags: ["piano", "classic-rock", "road-trip"],
    daysAgo: 4,
  },
  {
    creator: "mira_echo",
    url: "https://www.youtube.com/watch?v=k2bBTWvmN-8",
    caption: "abba — dancing queen. friday night every time",
    tags: ["disco", "pop", "friday-night"],
    daysAgo: 4,
  },
  {
    creator: "crate_diver",
    url: "https://soundcloud.com/abba-official/dancing-queen",
    caption: "abba on soundcloud hits just as hard",
    tags: ["disco", "pop", "soundcloud"],
    daysAgo: 3,
  },
  {
    creator: "luna_tracks",
    url: "https://open.spotify.com/track/2TxCwUlqaOH3TIyJqGgR91",
    caption: "abba — mamma mia. impossible not to sing along",
    tags: ["pop", "sing-along", "feel-good"],
    daysAgo: 2,
  },
  {
    creator: "juns_vinyl",
    url: "https://www.youtube.com/watch?v=r8OipmKFDeM",
    caption: "oasis — don't look back in anger. britpop peak",
    tags: ["britpop", "90s", "anthem"],
    daysAgo: 0,
  },
] as const;

const SEED_LIKES: Array<{ user: string; postIndex: number }> = [
  { user: "mira_echo", postIndex: 0 },
  { user: "juns_vinyl", postIndex: 0 },
  { user: "crate_diver", postIndex: 0 },
  { user: "alex_tapes", postIndex: 1 },
  { user: "luna_tracks", postIndex: 1 },
  { user: "crate_diver", postIndex: 2 },
  { user: "juns_vinyl", postIndex: 2 },
  { user: "mira_echo", postIndex: 3 },
  { user: "luna_tracks", postIndex: 3 },
  { user: "alex_tapes", postIndex: 4 },
  { user: "crate_diver", postIndex: 4 },
  { user: "mira_echo", postIndex: 5 },
  { user: "alex_tapes", postIndex: 5 },
];

const SEED_COMMENTS: Array<{
  user: string;
  postIndex: number;
  content: string;
  hoursAgo: number;
}> = [
  {
    user: "mira_echo",
    postIndex: 0,
    content: "wonderwall comments aside, this song still lands",
    hoursAgo: 96,
  },
  {
    user: "crate_diver",
    postIndex: 0,
    content: "oasis at full volume is a requirement",
    hoursAgo: 72,
  },
  {
    user: "alex_tapes",
    postIndex: 1,
    content: "piano man at the bar — instant singalong",
    hoursAgo: 64,
  },
  {
    user: "luna_tracks",
    postIndex: 2,
    content: "abba never misses. dancing queen forever",
    hoursAgo: 48,
  },
  {
    user: "juns_vinyl",
    postIndex: 3,
    content: "abba on soundcloud — did not expect this here but yes",
    hoursAgo: 36,
  },
  {
    user: "mira_echo",
    postIndex: 4,
    content: "mamma mia unlocked a core memory",
    hoursAgo: 24,
  },
  {
    user: "alex_tapes",
    postIndex: 5,
    content: "don't look back in anger still gives me chills",
    hoursAgo: 8,
  },
  {
    user: "juns_vinyl",
    postIndex: 5,
    content: "britpop peak right here",
    hoursAgo: 4,
  },
];

function seedUsernames() {
  return SEED_USERS.map((user) => user.name);
}

async function clearSeedData() {
  const names = seedUsernames();
  const users = await User.find({ name: { $in: names } }).select("_id");
  const userIds = users.map((user) => user._id);

  if (userIds.length === 0) {
    console.log("No seed users found to remove.");
    return;
  }

  const posts = await MusicPost.find({ creator: { $in: userIds } }).select("_id");
  const postIds = posts.map((post) => post._id);

  const [deletedComments, deletedLikes, deletedPosts, deletedUsers] =
    await Promise.all([
      Comment.deleteMany({
        $or: [{ byUser: { $in: userIds } }, { onPost: { $in: postIds } }],
      }),
      Like.deleteMany({
        $or: [{ byUser: { $in: userIds } }, { toPost: { $in: postIds } }],
      }),
      MusicPost.deleteMany({ _id: { $in: postIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);

  console.log(`Removed seed data:`);
  console.log(`  users: ${deletedUsers.deletedCount}`);
  console.log(`  posts: ${deletedPosts.deletedCount}`);
  console.log(`  likes: ${deletedLikes.deletedCount}`);
  console.log(`  comments: ${deletedComments.deletedCount}`);
}

async function seedDatabase() {
  const shouldClearOnly = process.argv.slice(2).includes("--clear");

  console.log("Connecting to MongoDB...");
  await connectDB();

  const dbName = mongoose.connection.db?.databaseName ?? "unknown";
  console.log(`Using database: ${dbName}\n`);

  const existing = await User.findOne({ name: SEED_USERS[0].name });
  if (existing) {
    console.log("Removing previous seed data...");
    await clearSeedData();
    console.log("");
  }

  if (shouldClearOnly) {
    console.log("Done (--clear: seed data removed, nothing re-inserted).");
    return;
  }

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);
  const now = new Date();
  const userByName = new Map<string, mongoose.Types.ObjectId>();
  const providerCounts = new Map<string, number>();

  console.log("Creating users...");
  for (const [index, seedUser] of SEED_USERS.entries()) {
    const created = await User.create({
      name: seedUser.name,
      email: seedUser.email,
      information: seedUser.information,
      password: hashedPassword,
      datejoin: formatISO(subDays(now, 30 - index * 4)),
      posts: [],
      comments: [],
      likes: [],
    });
    userByName.set(seedUser.name, created._id);
    console.log(`  + ${seedUser.name} (${seedUser.email})`);
  }

  const postIds: mongoose.Types.ObjectId[] = [];

  console.log("\nCreating posts...");
  for (const seedPost of SEED_POSTS) {
    const creatorId = userByName.get(seedPost.creator);
    if (!creatorId) {
      throw new Error(`Unknown seed creator: ${seedPost.creator}`);
    }

    const media = await resolveMediaUrl(seedPost.url);
    if (!media) {
      throw new Error(`Could not resolve seed post URL: ${seedPost.url}`);
    }

    const post = await MusicPost.create({
      posturl: media.embedUrl,
      caption: seedPost.caption,
      tags: [...seedPost.tags],
      creator: creatorId,
      date: formatISO(subDays(now, seedPost.daysAgo)),
      comments: [],
      likes: [],
    });

    await User.updateOne({ _id: creatorId }, { $push: { posts: post._id } });
    postIds.push(post._id);
    providerCounts.set(
      media.provider,
      (providerCounts.get(media.provider) ?? 0) + 1,
    );
    console.log(
      `  + [${media.provider}] ${seedPost.caption.slice(0, 48)}... (${seedPost.creator})`,
    );
  }

  console.log("\nCreating likes...");
  for (const seedLike of SEED_LIKES) {
    const userId = userByName.get(seedLike.user);
    const postId = postIds[seedLike.postIndex];
    if (!userId || !postId) continue;

    const like = await Like.create({
      byUser: userId,
      toPost: postId,
    });

    await Promise.all([
      User.updateOne({ _id: userId }, { $push: { likes: like._id } }),
      MusicPost.updateOne({ _id: postId }, { $push: { likes: like._id } }),
    ]);
  }
  console.log(`  + ${SEED_LIKES.length} likes`);

  console.log("\nCreating comments...");
  for (const seedComment of SEED_COMMENTS) {
    const userId = userByName.get(seedComment.user);
    const postId = postIds[seedComment.postIndex];
    if (!userId || !postId) continue;

    const comment = await Comment.create({
      byUser: userId,
      content: seedComment.content,
      date: formatISO(subHours(now, seedComment.hoursAgo)),
      onPost: postId,
    });

    await Promise.all([
      User.updateOne({ _id: userId }, { $push: { comments: comment._id } }),
      MusicPost.updateOne({ _id: postId }, { $push: { comments: comment._id } }),
    ]);
  }
  console.log(`  + ${SEED_COMMENTS.length} comments`);

  console.log("\nSeed complete.");
  console.log(`  users: ${SEED_USERS.length}`);
  console.log(`  posts: ${SEED_POSTS.length}`);
  console.log(
    `  providers: ${[...providerCounts.entries()]
      .map(([provider, count]) => `${provider} ${count}`)
      .join(", ")}`,
  );
  console.log(`  likes: ${SEED_LIKES.length}`);
  console.log(`  comments: ${SEED_COMMENTS.length}`);
  console.log(`\nLogin with any seed user / password: ${SEED_PASSWORD}`);
  console.log(`  e.g. ${SEED_USERS[0].name}`);
  console.log("\nPassword reset: sign up at /signup with your own email to test.");
}

seedDatabase()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
