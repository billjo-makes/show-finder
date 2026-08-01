import type { NextFunction, Request, Response } from "express";

export function requireProfile(req: Request, res: Response, next: NextFunction) {
  if (!req.profileId) {
    res.status(401).json({ error: "No active profile", code: "NO_PROFILE" });
    return;
  }
  next();
}
