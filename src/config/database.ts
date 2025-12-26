import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectToDatabase = async () => {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
    if (isDev) {
      console.log("Connected to MongoDB");
    }

    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected"),
    );
    mongoose.connection.on("reconnected", () => {
      if (isDev) {
        console.log("MongoDB reconnected");
      }
    });
    mongoose.connection.on("error", (err) =>
      console.error("MongoDB error:", err),
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};
