/**
 * Delete all app data from MongoDB (users, posts, likes, comments).
 *
 * Usage:
 *   npm run db:clear -- --yes
 *
 * Collections are kept; only documents are removed.
 * Re-run `npm run db:init` if you need indexes recreated.
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose, { type Model } from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { User } from "../src/lib/models/User";
import { MusicPost } from "../src/lib/models/MusicPost";
import { Comment } from "../src/lib/models/Comment";
import { Like } from "../src/lib/models/Like";

type ClearableModel = Model<unknown>;

const collections: { name: string; model: ClearableModel }[] = [
  { name: "comments", model: Comment },
  { name: "likes", model: Like },
  { name: "musicposts", model: MusicPost },
  { name: "users", model: User },
];

async function clearDatabase() {
  const confirmed = process.argv.slice(2).includes("--yes");
  if (!confirmed) {
    console.error("This deletes ALL users, posts, likes, and comments.");
    console.error("Run: npm run db:clear -- --yes");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await connectDB();

  const dbName = mongoose.connection.db?.databaseName ?? "unknown";
  console.log(`Using database: ${dbName}\n`);

  for (const { name, model } of collections) {
    const before = await model.countDocuments();
    const result = await model.deleteMany({});
    console.log(`  ${name}: removed ${result.deletedCount} (was ${before})`);
  }

  console.log("\nDatabase cleared.");
}

clearDatabase()
  .catch((error) => {
    console.error("Clear failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
