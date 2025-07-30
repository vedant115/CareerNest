import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/job-tracker",
      {
        // Add connection options that might help with connection issues
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    // Log more details about the error
    if (error.name === "MongoServerSelectionError") {
      console.error(
        "Connection details:",
        process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":****@")
      );
    }
    process.exit(1);
  }
};

export default connectDB;
