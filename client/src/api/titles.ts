import type { Genre, MediaType, TitleDetail, TitleSummary } from "@show-finder/shared";
import { apiFetch } from "./client";

interface SearchResponse {
  results: TitleSummary[];
  page: number;
  totalPages: number;
}

export function searchTitles(query: string, page = 1) {
  return apiFetch<SearchResponse>(
    `/api/tmdb/search?query=${encodeURIComponent(query)}&mediaType=multi&page=${page}`,
  );
}

export function discoverTitles(mediaType: MediaType, genreIds: number[], page = 1) {
  const params = new URLSearchParams({ mediaType, page: String(page) });
  if (genreIds.length > 0) params.set("genreIds", genreIds.join(","));
  return apiFetch<SearchResponse>(`/api/tmdb/discover?${params.toString()}`);
}

export function fetchTrending(mediaType: MediaType | "all" = "all") {
  return apiFetch<{ results: TitleSummary[] }>(`/api/tmdb/trending?mediaType=${mediaType}`);
}

export function fetchGenres(mediaType: MediaType) {
  return apiFetch<{ genres: Genre[] }>(`/api/tmdb/genres?mediaType=${mediaType}`);
}

export function fetchTitleDetail(mediaType: MediaType, id: number) {
  return apiFetch<TitleDetail>(`/api/tmdb/title/${mediaType}/${id}`);
}

export function fetchSimilarTitles(mediaType: MediaType, id: number) {
  return apiFetch<{ results: TitleSummary[] }>(`/api/tmdb/title/${mediaType}/${id}/similar`);
}
