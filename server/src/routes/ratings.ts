import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireProfile } from "../middleware/requireProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { canManageProfile } from "../services/profileAccess";

export const ratingsRouter = Router();
ratingsRouter.use(requireAuth, requireProfile);

function toDTO(rating: {
  id: string;
  tmdbId: number;
  mediaType: string;
  value: number;
  title: string;
  posterPath: string | null;
  genreIds: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: rating.id,
    tmdbId: rating.tmdbId,
    mediaType: rating.mediaType,
    value: rating.value,
    title: rating.title,
    posterPath: rating.posterPath,
    genreIds: JSON.parse(rating.genreIds) as number[],
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
  };
}

const upsertSchema = z.object({
  tmdbId: z.number(),
  mediaType: z.enum(["movie", "tv"]),
  value: z.number().int().min(1).max(5),
  title: z.string(),
  posterPath: z.string().nullable(),
  genreIds: z.array(z.number()),
  profileId: z.string().optional(),
});

ratingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = upsertSchema.parse(req.body);
    let profileId = req.profileId!;

    if (body.profileId && body.profileId !== profileId) {
      const allowed = await canManageProfile(req.userId!, profileId, body.profileId);
      if (!allowed) {
        res.status(403).json({ error: "Not allowed to rate on behalf of this profile" });
        return;
      }
      profileId = body.profileId;
    }

    const [rating] = await prisma.$transaction([
      prisma.rating.upsert({
        where: {
          profileId_tmdbId_mediaType: {
            profileId,
            tmdbId: body.tmdbId,
            mediaType: body.mediaType,
          },
        },
        update: {
          value: body.value,
          title: body.title,
          posterPath: body.posterPath,
          genreIds: JSON.stringify(body.genreIds),
        },
        create: {
          profileId,
          tmdbId: body.tmdbId,
          mediaType: body.mediaType,
          value: body.value,
          title: body.title,
          posterPath: body.posterPath,
          genreIds: JSON.stringify(body.genreIds),
        },
      }),
      // Rating a title means it's been watched, so it no longer belongs on the watch list.
      prisma.watchlistEntry.deleteMany({
        where: { profileId, tmdbId: body.tmdbId, mediaType: body.mediaType },
      }),
    ]);

    res.status(201).json({ rating: toDTO(rating) });
  }),
);

ratingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { profileId: queryProfileId } = z
      .object({ profileId: z.string().optional() })
      .parse(req.query);

    let profileId = req.profileId!;
    if (queryProfileId && queryProfileId !== profileId) {
      const allowed = await canManageProfile(req.userId!, profileId, queryProfileId);
      if (!allowed) {
        res.status(403).json({ error: "Not allowed to view this profile's ratings" });
        return;
      }
      profileId = queryProfileId;
    }

    const ratings = await prisma.rating.findMany({
      where: { profileId },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ ratings: ratings.map(toDTO) });
  }),
);

ratingsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const rating = await prisma.rating.findUnique({ where: { id } });
    if (!rating) {
      res.status(404).json({ error: "Rating not found" });
      return;
    }

    const allowed = await canManageProfile(req.userId!, req.profileId!, rating.profileId);
    if (!allowed) {
      res.status(404).json({ error: "Rating not found" });
      return;
    }

    await prisma.rating.delete({ where: { id } });
    res.status(204).send();
  }),
);
