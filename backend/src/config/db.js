import mongoose from "mongoose";

export async function connectDb(mongoUri) {
  if (!mongoUri) throw new Error("Missing MONGODB_URI");

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    family: 4, // Force IPv4 to fix Windows DNS issues
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  return mongoose.connection;
}