import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireProfile } from "../middleware/requireProfile";
import { asyncHandler } from "../utils/asyncHandler";

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
});

ratingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = upsertSchema.parse(req.body);
    const profileId = req.profileId!;

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
    const ratings = await prisma.rating.findMany({
      where: { profileId: req.profileId! },
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
    if (!rating || rating.profileId !== req.profileId) {
      res.status(404).json({ error: "Rating not found" });
      return;
    }

    await prisma.rating.delete({ where: { id } });
    res.status(204).send();
  }),
);
