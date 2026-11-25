import mongoose from "mongoose";

// Read at call time so `next build` can collect route data without a .env yet.
function getMongodbUri() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please provide a valid MONGODB_URI in your .env file");
  }
  return MONGODB_URI;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectMongodb = async () => {
  // Return existing healthy connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a previous promise exists but connection is no longer open, reset
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(getMongodbUri(), {
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset cache so next call retries the connection
    cached.promise = null;
    cached.conn = null;
    console.error("[db] MongoDB connection error:", error?.message || error);
    throw error;
  }
};
