import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { tmdbRouter } from "./routes/tmdb";
import { ratingsRouter } from "./routes/ratings";
import { recommendationsRouter } from "./routes/recommendations";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tmdb", tmdbRouter);
  app.use("/api/ratings", ratingsRouter);
  app.use("/api/recommendations", recommendationsRouter);

  app.use(errorHandler);

  return app;
}
