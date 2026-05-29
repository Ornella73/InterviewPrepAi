import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import letterRoutes from "./routes/letterRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import practicalRoutes from "./routes/practicalRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "InterviewPrep AI API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/practical", practicalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/voice", voiceRoutes);

// --- Deployment Configuration ---
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    // If request is not an API route, serve the frontend index.html
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.resolve(frontendPath, "index.html"));
    } else {
      res.status(404).json({ message: "API Route not found" });
    }
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

export default app;
