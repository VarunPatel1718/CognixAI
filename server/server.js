import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import newsletterRouter from "./routes/newsletterRoutes.js";
import sql from "./configs/db.js";
import connectCloudinary from './configs/cloudinary.js';

const app = express();

await connectCloudinary();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cognixai-saas.vercel.app",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(clerkMiddleware());

// PUBLIC routes
app.get("/", (req, res) => res.send("Server is Live!"));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CognixAI server is running",
    timestamp: new Date(),
  });
});

// PROTECTED routes
app.use("/api/ai", aiRouter);
app.use("/api/newsletter", newsletterRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
