import type { MediaType, TitleSummary } from "@show-finder/shared";
import { prisma } from "../prisma";
import { normalizeSummary, tmdbClient } from "./tmdbClient";

const MIN_RATINGS_FOR_PERSONALIZATION = 3;
const TOP_GENRE_COUNT = 3;
const TOP_RATED_TITLES_TO_BLEND = 2;
const SIMILAR_RESULTS_PER_TITLE = 5;
const MAX_RESULTS = 20;

interface RecommendationResult {
  results: TitleSummary[];
  basedOn: { genreNames: string[] };
}

export async function getRecommendations(
  profileId: string,
  mediaType: MediaType,
): Promise<RecommendationResult> {
  const ratings = await prisma.rating.findMany({
    where: { profileId, mediaType },
    orderBy: { updatedAt: "desc" },
  });

  if (ratings.length < MIN_RATINGS_FOR_PERSONALIZATION) {
    const { data } = await tmdbClient.get(`/trending/${mediaType}/week`);
    const results = data.results
      .slice(0, MAX_RESULTS)
      .map((raw: Parameters<typeof normalizeSummary>[0]) => normalizeSummary(raw, mediaType));
    return { results, basedOn: { genreNames: [] } };
  }

  const genreScores = new Map<number, number>();
  for (const rating of ratings) {
    const genreIds = JSON.parse(rating.genreIds) as number[];
    const weight = rating.value - 3;
    for (const genreId of genreIds) {
      genreScores.set(genreId, (genreScores.get(genreId) ?? 0) + weight);
    }
  }

  const topGenreIds = [...genreScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRE_COUNT)
    .map(([id]) => id);

  const ratedKeys = new Set(ratings.map((r) => r.tmdbId));

  const candidates: TitleSummary[] = [];

  if (topGenreIds.length > 0) {
    const { data } = await tmdbClient.get(`/discover/${mediaType}`, {
      params: { with_genres: topGenreIds.join("|"), sort_by: "popularity.desc" },
    });
    candidates.push(
      ...data.results.map((raw: Parameters<typeof normalizeSummary>[0]) =>
        normalizeSummary(raw, mediaType),
      ),
    );
  }

  const topRatedTitles = [...ratings].sort((a, b) => b.value - a.value).slice(0, TOP_RATED_TITLES_TO_BLEND);

  for (const title of topRatedTitles) {
    const { data } = await tmdbClient.get(`/${mediaType}/${title.tmdbId}/similar`);
    candidates.push(
      ...data.results
        .slice(0, SIMILAR_RESULTS_PER_TITLE)
        .map((raw: Parameters<typeof normalizeSummary>[0]) => normalizeSummary(raw, mediaType)),
    );
  }

  const seen = new Set<number>();
  const deduped = candidates.filter((c) => {
    if (ratedKeys.has(c.tmdbId) || seen.has(c.tmdbId)) return false;
    seen.add(c.tmdbId);
    return true;
  });

  const genreNames = await resolveGenreNames(mediaType, topGenreIds);

  return {
    results: deduped.slice(0, MAX_RESULTS),
    basedOn: { genreNames },
  };
}

async function resolveGenreNames(mediaType: MediaType, genreIds: number[]): Promise<string[]> {
  if (genreIds.length === 0) return [];
  const { data } = await tmdbClient.get(`/genre/${mediaType}/list`);
  const nameById = new Map<number, string>(
    data.genres.map((g: { id: number; name: string }) => [g.id, g.name]),
  );
  return genreIds.map((id) => nameById.get(id)).filter((name): name is string => Boolean(name));
}
