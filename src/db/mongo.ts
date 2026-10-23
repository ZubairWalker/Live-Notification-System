import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  // Accept MONGO_URI as well because it is the conventional MongoDB variable name.
  const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is required. Copy .env.example to .env first.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
