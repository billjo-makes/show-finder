import { Router } from "express";
import { z } from "zod";
import type { MediaType } from "@show-finder/shared";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import {
  normalizeDetail,
  normalizeSummary,
  resolveMediaTypeFromMulti,
  tmdbClient,
} from "../services/tmdbClient";
import { fetchExternalRatings } from "../services/omdbClient";

export const tmdbRouter = Router();
tmdbRouter.use(requireAuth);

const mediaTypeSchema = z.enum(["movie", "tv"]);

// Filters out low-sample titles (e.g. 1 vote at 10.0) whenever a minimum
// rating filter is applied, so the score floor is actually meaningful.
const MIN_VOTE_COUNT_FOR_RATING_FILTER = 50;

tmdbRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { query, mediaType, page } = z
      .object({
        query: z.string().min(1),
        mediaType: z.enum(["movie", "tv", "multi"]).default("multi"),
        page: z.coerce.number().default(1),
      })
      .parse(req.query);

    if (mediaType === "multi") {
      const { data } = await tmdbClient.get("/search/multi", { params: { query, page } });
      const results = data.results
        .map((raw: Parameters<typeof resolveMediaTypeFromMulti>[0]) => {
          const type = resolveMediaTypeFromMulti(raw);
          return type ? normalizeSummary(raw, type) : null;
        })
        .filter(Boolean);
      res.json({ results, page: data.page, totalPages: data.total_pages });
      return;
    }

    const { data } = await tmdbClient.get(`/search/${mediaType}`, { params: { query, page } });
    const results = data.results.map((raw: Parameters<typeof normalizeSummary>[0]) =>
      normalizeSummary(raw, mediaType as MediaType),
    );
    res.json({ results, page: data.page, totalPages: data.total_pages });
  }),
);

tmdbRouter.get(
  "/discover",
  asyncHandler(async (req, res) => {
    const { mediaType, genreIds, keywordIds, watchProviderIds, originalLanguage, minRating, sortBy, page } =
      z
        .object({
          mediaType: mediaTypeSchema,
          genreIds: z.string().optional(),
          keywordIds: z.string().optional(),
          watchProviderIds: z.string().optional(),
          originalLanguage: z.string().optional(),
          minRating: z.coerce.number().min(0).max(10).optional(),
          sortBy: z.string().default("popularity.desc"),
          page: z.coerce.number().default(1),
        })
        .parse(req.query);

    // TMDB requires a region whenever with_watch_providers is set.
    let watchRegion: string | undefined;
    if (watchProviderIds) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      watchRegion = user?.country ?? "US";
    }

    // TMDB uses "," for AND and "|" for OR; provider chips should be OR'd
    // together (any selected service), unlike genres which are AND'd.
    const watchProvidersParam = watchProviderIds?.split(",").join("|");

    const { data } = await tmdbClient.get(`/discover/${mediaType}`, {
      params: {
        with_genres: genreIds,
        with_keywords: keywordIds,
        with_watch_providers: watchProvidersParam,
        watch_region: watchRegion,
        with_original_language: originalLanguage,
        "vote_average.gte": minRating,
        // Without a vote-count floor, a title with 2 votes at 9.0 would
        // outrank a well-reviewed title with thousands of votes at 7.5.
        "vote_count.gte": minRating !== undefined ? MIN_VOTE_COUNT_FOR_RATING_FILTER : undefined,
        sort_by: sortBy,
        page,
      },
    });
    const results = data.results.map((raw: Parameters<typeof normalizeSummary>[0]) =>
      normalizeSummary(raw, mediaType),
    );
    res.json({ results, page: data.page, totalPages: data.total_pages });
  }),
);

tmdbRouter.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const { mediaType, window } = z
      .object({
        mediaType: z.enum(["movie", "tv", "all"]).default("all"),
        window: z.enum(["day", "week"]).default("week"),
      })
      .parse(req.query);

    const { data } = await tmdbClient.get(`/trending/${mediaType}/${window}`);
    const results = data.results
      .map((raw: Parameters<typeof normalizeSummary>[0] & { media_type?: string }) => {
        const type = mediaType === "all" ? resolveMediaTypeFromMulti(raw) : (mediaType as MediaType);
        return type ? normalizeSummary(raw, type) : null;
      })
      .filter(Boolean);
    res.json({ results });
  }),
);

tmdbRouter.get(
  "/watch-providers",
  asyncHandler(async (req, res) => {
    const { mediaType } = z.object({ mediaType: mediaTypeSchema }).parse(req.query);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const countryCode = user?.country ?? "US";

    const { data } = await tmdbClient.get(`/watch/providers/${mediaType}`, {
      params: { watch_region: countryCode },
    });
    const providers = (data.results ?? [])
      .sort((a: { display_priority: number }, b: { display_priority: number }) => a.display_priority - b.display_priority)
      .map((p: { provider_id: number; provider_name: string; logo_path: string | null }) => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
      }));
    res.json({ providers });
  }),
);

tmdbRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    const { data } = await tmdbClient.get("/configuration/languages");
    const languages = (data ?? [])
      .filter((l: { iso_639_1: string; english_name: string }) => l.english_name)
      .map((l: { iso_639_1: string; english_name: string }) => ({
        code: l.iso_639_1,
        name: l.english_name,
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
    res.json({ languages });
  }),
);

tmdbRouter.get(
  "/genres",
  asyncHandler(async (req, res) => {
    const { mediaType } = z.object({ mediaType: mediaTypeSchema }).parse(req.query);
    const { data } = await tmdbClient.get(`/genre/${mediaType}/list`);
    res.json({ genres: data.genres });
  }),
);

tmdbRouter.get(
  "/title/:mediaType/:id",
  asyncHandler(async (req, res) => {
    const { mediaType, id } = z
      .object({ mediaType: mediaTypeSchema, id: z.coerce.number() })
      .parse(req.params);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const countryCode = user?.country ?? "US";

    const { data } = await tmdbClient.get(`/${mediaType}/${id}`, {
      params: { append_to_response: "credits,watch/providers,external_ids" },
    });

    // Movies expose imdb_id directly; TV only has it under external_ids.
    const imdbId: string | null = data.imdb_id ?? data.external_ids?.imdb_id ?? null;
    const externalRatings = await fetchExternalRatings(imdbId);

    res.json({ ...normalizeDetail(data, mediaType, countryCode), externalRatings });
  }),
);

tmdbRouter.get(
  "/title/:mediaType/:id/similar",
  asyncHandler(async (req, res) => {
    const { mediaType, id } = z
      .object({ mediaType: mediaTypeSchema, id: z.coerce.number() })
      .parse(req.params);

    const { data } = await tmdbClient.get(`/${mediaType}/${id}/similar`);
    const results = data.results.map((raw: Parameters<typeof normalizeSummary>[0]) =>
      normalizeSummary(raw, mediaType),
    );
    res.json({ results });
  }),
);
