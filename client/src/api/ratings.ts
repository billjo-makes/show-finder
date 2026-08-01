import type { MediaType, RatingDTO, RecommendationsResponse } from "@show-finder/shared";
import { apiFetch } from "./client";

export interface RateTitleInput {
  tmdbId: number;
  mediaType: MediaType;
  value: number;
  title: string;
  posterPath: string | null;
  genreIds: number[];
}

export function rateTitle(input: RateTitleInput) {
  return apiFetch<{ rating: RatingDTO }>("/api/ratings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchRatings() {
  return apiFetch<{ ratings: RatingDTO[] }>("/api/ratings");
}

export function deleteRating(id: string) {
  return apiFetch<void>(`/api/ratings/${id}`, { method: "DELETE" });
}

export function fetchRecommendations(mediaType: MediaType) {
  return apiFetch<RecommendationsResponse>(`/api/recommendations?mediaType=${mediaType}`);
}
