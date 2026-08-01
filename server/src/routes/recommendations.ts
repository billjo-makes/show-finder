import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { requireProfile } from "../middleware/requireProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { getRecommendations } from "../services/recommendationService";

export const recommendationsRouter = Router();
recommendationsRouter.use(requireAuth, requireProfile);

recommendationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { mediaType } = z
      .object({ mediaType: z.enum(["movie", "tv"]).default("movie") })
      .parse(req.query);

    const recommendations = await getRecommendations(req.profileId!, mediaType);
    res.json(recommendations);
  }),
);
