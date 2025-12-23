import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL as string);
        console.log("Connected to MongoDB");

        mongoose.connection.on("disconnected", () =>
            console.warn("MongoDB disconnected")
        );
        mongoose.connection.on("reconnected", () =>
            console.log("MongoDB reconnected")
        );
        mongoose.connection.on("error", (err) =>
            console.error("MongoDB error:", err)
        );
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};
