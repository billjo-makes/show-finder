import { Router } from "express";
import { z } from "zod";
import type { ProfileDTO } from "@show-finder/shared";
import { prisma } from "../prisma";
import { AUTH_COOKIE_NAME, authCookieOptions, signToken } from "../services/authService";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";

export const profilesRouter = Router();
profilesRouter.use(requireAuth);

function toDTO(profile: {
  id: string;
  name: string;
  avatarColor: string | null;
  defaultWatchProviderIds: string;
  createdAt: Date;
}): ProfileDTO {
  return {
    id: profile.id,
    name: profile.name,
    avatarColor: profile.avatarColor,
    defaultWatchProviderIds: JSON.parse(profile.defaultWatchProviderIds) as number[],
    createdAt: profile.createdAt.toISOString(),
  };
}

const profileSchema = z.object({
  name: z.string().min(1).max(50),
  avatarColor: z.string().nullable().optional(),
  defaultWatchProviderIds: z.array(z.number()).optional(),
});

profilesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "asc" },
    });
    res.json({ profiles: profiles.map(toDTO) });
  }),
);

profilesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = profileSchema.parse(req.body);
    const profile = await prisma.profile.create({
      data: {
        userId: req.userId!,
        name: body.name,
        avatarColor: body.avatarColor ?? null,
        defaultWatchProviderIds: JSON.stringify(body.defaultWatchProviderIds ?? []),
      },
    });
    res.status(201).json({ profile: toDTO(profile) });
  }),
);

profilesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = profileSchema.partial().parse(req.body);

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const profile = await prisma.profile.update({
      where: { id },
      data: {
        name: body.name,
        avatarColor: body.avatarColor,
        defaultWatchProviderIds: JSON.stringify(body.defaultWatchProviderIds),
      },
    });
    res.json({ profile: toDTO(profile) });
  }),
);

profilesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    await prisma.profile.delete({ where: { id } });

    if (req.profileId === id) {
      const token = signToken(req.userId!);
      res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    }

    res.status(204).send();
  }),
);

profilesRouter.post(
  "/:id/select",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile || profile.userId !== req.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const token = signToken(req.userId!, profile.id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.json({ activeProfile: toDTO(profile) });
  }),
);
