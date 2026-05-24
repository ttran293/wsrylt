/**
 * Seed synthetic users, posts, likes, and comments.
 *
 * Usage:
 *   npm run db:seed              (remove old seed data, then insert fresh)
 *   npm run db:seed -- --clear   (remove seed data only, no re-insert)
 *
 * All seed users share password: seed123
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import bcrypt from "bcryptjs";
import { formatISO, subDays, subHours } from "date-fns";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
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
    videoId: "hT_nvWreIhg",
    caption: "counting stars on a long night drive",
    daysAgo: 6,
  },
  {
    creator: "juns_vinyl",
    videoId: "fJ9rUzIMcZQ",
    caption: "bohemian rhapsody — every section hits",
    daysAgo: 5,
  },
  {
    creator: "mira_echo",
    videoId: "1ti2YCFgCoI",
    caption: "take on me because the synth never gets old",
    daysAgo: 4,
  },
  {
    creator: "crate_diver",
    videoId: "L_jWHffIx5E",
    caption: "all star energy for the walk home",
    daysAgo: 3,
  },
  {
    creator: "luna_tracks",
    videoId: "kXYiU_JCYtU",
    caption: "numb but in a nostalgic way",
    daysAgo: 3,
  },
  {
    creator: "alex_tapes",
    videoId: "kJQP7kiw5Fk",
    caption: "despacito — everyone knows every word",
    daysAgo: 2,
  },
  {
    creator: "mira_echo",
    videoId: "y6120QOlsfU",
    caption: "sandstorm for focus mode",
    daysAgo: 1,
  },
  {
    creator: "juns_vinyl",
    videoId: "9bZkp7q19f0",
    caption: "throwback party starter",
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
  { user: "crate_diver", postIndex: 5 },
  { user: "juns_vinyl", postIndex: 6 },
  { user: "mira_echo", postIndex: 7 },
  { user: "alex_tapes", postIndex: 7 },
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
    content: "this one always gets stuck in my head",
    hoursAgo: 120,
  },
  {
    user: "crate_diver",
    postIndex: 0,
    content: "late night playlist essential",
    hoursAgo: 96,
  },
  {
    user: "alex_tapes",
    postIndex: 1,
    content: "six minutes of pure chaos, love it",
    hoursAgo: 88,
  },
  {
    user: "luna_tracks",
    postIndex: 2,
    content: "that chorus is impossible not to sing",
    hoursAgo: 72,
  },
  {
    user: "juns_vinyl",
    postIndex: 3,
    content: "saved this one immediately",
    hoursAgo: 48,
  },
  {
    user: "mira_echo",
    postIndex: 4,
    content: "high school flashbacks unlocked",
    hoursAgo: 40,
  },
  {
    user: "crate_diver",
    postIndex: 5,
    content: "perfect commute song",
    hoursAgo: 24,
  },
  {
    user: "luna_tracks",
    postIndex: 6,
    content: "did not expect this here but I respect it",
    hoursAgo: 12,
  },
  {
    user: "alex_tapes",
    postIndex: 7,
    content: "still goes hard in 2026",
    hoursAgo: 6,
  },
  {
    user: "juns_vinyl",
    postIndex: 7,
    content: "instant dance floor",
    hoursAgo: 3,
  },
];

function embedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

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
    console.log(`  + ${seedUser.name}`);
  }

  const postIds: mongoose.Types.ObjectId[] = [];

  console.log("\nCreating posts...");
  for (const seedPost of SEED_POSTS) {
    const creatorId = userByName.get(seedPost.creator);
    if (!creatorId) {
      throw new Error(`Unknown seed creator: ${seedPost.creator}`);
    }

    const post = await MusicPost.create({
      posturl: embedUrl(seedPost.videoId),
      caption: seedPost.caption,
      creator: creatorId,
      date: formatISO(subDays(now, seedPost.daysAgo)),
      comments: [],
      likes: [],
    });

    await User.updateOne({ _id: creatorId }, { $push: { posts: post._id } });
    postIds.push(post._id);
    console.log(`  + ${seedPost.caption.slice(0, 48)}... (${seedPost.creator})`);
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
  console.log(`  likes: ${SEED_LIKES.length}`);
  console.log(`  comments: ${SEED_COMMENTS.length}`);
  console.log(`\nLogin with any seed user / password: ${SEED_PASSWORD}`);
  console.log(`  e.g. ${SEED_USERS[0].name}`);
}

seedDatabase()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
