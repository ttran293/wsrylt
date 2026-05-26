/**
 * Creates MongoDB collections and syncs indexes from Mongoose models.
 *
 * Usage: npm run db:init
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { User } from "../src/lib/models/User";
import { MusicPost } from "../src/lib/models/MusicPost";
import { Comment } from "../src/lib/models/Comment";
import { Like } from "../src/lib/models/Like";
import { Notification } from "../src/lib/models/Notification";
import { PasswordResetToken } from "../src/lib/models/PasswordResetToken";

const models = [
  { name: "users", model: User },
  { name: "musicposts", model: MusicPost },
  { name: "comments", model: Comment },
  { name: "likes", model: Like },
  { name: "notifications", model: Notification },
  { name: "passwordresettokens", model: PasswordResetToken },
] as const;

async function initDatabase() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  const dbName = mongoose.connection.db?.databaseName ?? "unknown";
  console.log(`Using database: ${dbName}`);
  console.log("(In Atlas: Browse Collections → select this database name)\n");

  for (const { name, model } of models) {
    try {
      await model.createCollection();
      console.log(`Collection created: ${name}`);
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 48) {
        console.log(`Collection already exists: ${name}`);
      } else {
        throw error;
      }
    }
  }

  console.log("\nSyncing indexes...");
  for (const { name, model } of models) {
    const dropped = await model.syncIndexes();
    const indexes = await model.collection.indexes();
    const indexNames = indexes.map((idx) => idx.name).join(", ");
    console.log(`  ${name}: ${indexNames}${dropped.length ? ` (dropped: ${dropped.join(", ")})` : ""}`);
  }

  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.listCollections().toArray();
    const appCollections = collections
      .map((c) => c.name)
      .filter((n) => models.some((m) => m.name === n))
      .sort();

    console.log("\nCollections in database:");
    for (const collectionName of appCollections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  - ${collectionName} (${count} documents)`);
    }
  }

  console.log("\nDone.");
}

initDatabase()
  .catch((error) => {
    console.error("Database init failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
