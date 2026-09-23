import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";

const app = express();

/* -------------------------------------------------------
   CORS
------------------------------------------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

/* -------------------------------------------------------
   Middleware
------------------------------------------------------- */

app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* -------------------------------------------------------
   Health
------------------------------------------------------- */

app.get("/health", (_, res) =>
  res.json({
    ok: true,
    name: "FinSight API",
  })
);

/* -------------------------------------------------------
   API Routes
------------------------------------------------------- */

app.use("/api", routes);

/* -------------------------------------------------------
   Error Handler
------------------------------------------------------- */

app.use(
  (
    err: any,
    _req: any,
    res: any,
    _next: any
  ) => {
    console.error(err);

    res
      .status(err?.name === "ZodError" ? 422 : 500)
      .json({
        message:
          err?.name === "ZodError"
            ? "Validation failed"
            : "Internal server error",
      });
  }
);

/* -------------------------------------------------------
   Start Server
------------------------------------------------------- */

async function start() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/finsight"
    );

    console.log("MongoDB connected");
  } catch (e) {
    console.error(
      "MongoDB connection failed:",
      e
    );
  }

  app.listen(env.PORT, () =>
    console.log(
      `FinSight API running on ${env.PORT}`
    )
  );
}

start();

export default app;