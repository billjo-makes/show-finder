import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { tmdbRouter } from "./routes/tmdb";
import { ratingsRouter } from "./routes/ratings";
import { recommendationsRouter } from "./routes/recommendations";
import { profilesRouter } from "./routes/profiles";

export function createApp() {
  const app = express();

  app.use(
    cors({
      // Accept requests from the client regardless of which host it was loaded
      // from (localhost or any LAN IP) — only the client's dev-server port matters.
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        try {
          const clientPort = new URL(env.CLIENT_URL).port;
          const requestPort = new URL(origin).port;
          callback(null, requestPort === clientPort);
        } catch {
          callback(null, false);
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tmdb", tmdbRouter);
  app.use("/api/ratings", ratingsRouter);
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/profiles", profilesRouter);

  app.use(errorHandler);

  return app;
}
