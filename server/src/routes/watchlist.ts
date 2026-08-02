import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireProfile } from "../middleware/requireProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { canManageProfile } from "../services/profileAccess";

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth, requireProfile);

function toDTO(entry: {
  id: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  genreIds: string;
  createdAt: Date;
}) {
  return {
    id: entry.id,
    tmdbId: entry.tmdbId,
    mediaType: entry.mediaType,
    title: entry.title,
    posterPath: entry.posterPath,
    genreIds: JSON.parse(entry.genreIds) as number[],
    createdAt: entry.createdAt.toISOString(),
  };
}

const addSchema = z.object({
  tmdbId: z.number(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  posterPath: z.string().nullable(),
  genreIds: z.array(z.number()),
  profileId: z.string().optional(),
});

watchlistRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = addSchema.parse(req.body);
    let profileId = req.profileId!;

    if (body.profileId && body.profileId !== profileId) {
      const allowed = await canManageProfile(req.userId!, profileId, body.profileId);
      if (!allowed) {
        res.status(403).json({ error: "Not allowed to add to this profile's watch list" });
        return;
      }
      profileId = body.profileId;
    }

    const entry = await prisma.watchlistEntry.upsert({
      where: {
        profileId_tmdbId_mediaType: {
          profileId,
          tmdbId: body.tmdbId,
          mediaType: body.mediaType,
        },
      },
      update: {},
      create: {
        profileId,
        tmdbId: body.tmdbId,
        mediaType: body.mediaType,
        title: body.title,
        posterPath: body.posterPath,
        genreIds: JSON.stringify(body.genreIds),
      },
    });

    res.status(201).json({ entry: toDTO(entry) });
  }),
);

watchlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { profileId: queryProfileId } = z
      .object({ profileId: z.string().optional() })
      .parse(req.query);

    let profileId = req.profileId!;
    if (queryProfileId && queryProfileId !== profileId) {
      const allowed = await canManageProfile(req.userId!, profileId, queryProfileId);
      if (!allowed) {
        res.status(403).json({ error: "Not allowed to view this profile's watch list" });
        return;
      }
      profileId = queryProfileId;
    }

    const entries = await prisma.watchlistEntry.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ entries: entries.map(toDTO) });
  }),
);

watchlistRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const entry = await prisma.watchlistEntry.findUnique({ where: { id } });
    if (!entry) {
      res.status(404).json({ error: "Watchlist entry not found" });
      return;
    }

    const allowed = await canManageProfile(req.userId!, req.profileId!, entry.profileId);
    if (!allowed) {
      res.status(404).json({ error: "Watchlist entry not found" });
      return;
    }

    await prisma.watchlistEntry.delete({ where: { id } });
    res.status(204).send();
  }),
);
