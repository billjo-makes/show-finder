import type { MediaType, WatchlistEntryDTO } from "@show-finder/shared";
import { apiFetch } from "./client";

export interface AddToWatchlistInput {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  profileId?: string;
}

export function addToWatchlist(input: AddToWatchlistInput) {
  return apiFetch<{ entry: WatchlistEntryDTO }>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchWatchlist() {
  return apiFetch<{ entries: WatchlistEntryDTO[] }>("/api/watchlist");
}

export function removeFromWatchlist(id: string) {
  return apiFetch<void>(`/api/watchlist/${id}`, { method: "DELETE" });
}
