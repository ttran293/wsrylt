/**
 * Shows which database and collections the app is connected to.
 *
 * Usage: npm run db:status
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";

async function showStatus() {
  await connectDB();

  const db = mongoose.connection.db;  
  if (!db) {
    throw new Error("No database connection.");
  }

  const activeDb = db.databaseName;
  console.log("Connected database:", activeDb);

  const admin = mongoose.connection.getClient().db().admin();
  const { databases } = await admin.listDatabases();

  console.log("\nAll databases on this cluster:");
  for (const entry of databases) {
    const marker = entry.name === activeDb ? "  ← app uses this" : "";
    console.log(`  - ${entry.name}${marker}`);
  }

  const collections = await db.listCollections().toArray();
  console.log(`\nCollections in '${activeDb}':`);
  if (collections.length === 0) {
    console.log("  (none — collections may be in a different database)");
  } else {
    for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await db.collection(name).countDocuments();
      console.log(`  - ${name} (${count} documents)`);
    }
  }

  console.log("\nIn Atlas: open Browse Collections → select database '" + activeDb + "'");
}

showStatus()
  .catch((error) => {
    console.error("Status check failed:", error.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
