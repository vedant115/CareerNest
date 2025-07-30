import { config } from "dotenv";
config();
import express, { json, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import resumeRoutes from "./routes/resume.js";

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://careernest-frontend.onrender.com",
            "https://careernest-frontend-skyh.onrender.com",
          ]
        : [
            "http://localhost:5173",
            /^chrome-extension:\/\/.*$/, // Allow Chrome extensions
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

// Handle undefined routes
app.all(/(.*)/, (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

export default app;
