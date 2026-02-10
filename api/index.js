/**
 * Vercel serverless handler: runs the Express backend for all /api/* requests.
 * Set MONGODB_URI and other env vars in Vercel project settings.
 */

import { connectDb } from "../backend/src/config/db.js";
import { app } from "../backend/src/app.js";

let dbPromise = null;

function ensureDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  if (!dbPromise) dbPromise = connectDb(uri);
  return dbPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (err) {
    console.error("DB connect error:", err);
    res.status(500).json({
      success: false,
      error: { code: "DB_ERROR", message: "Database unavailable" },
    });
    return;
  }
  return app(req, res);
}
