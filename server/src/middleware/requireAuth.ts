import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyToken } from "../services/authService";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      profileId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const { userId, profileId } = verifyToken(token);
    req.userId = userId;
    req.profileId = profileId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
