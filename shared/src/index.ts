export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface TitleSummary {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  genreIds: number[];
  popularity: number;
  voteAverage: number;
  releaseDate: string | null;
}

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string | null;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface ExternalRating {
  source: string;
  value: string;
}

export interface TitleDetail extends TitleSummary {
  genres: Genre[];
  runtime: number | null;
  cast: { id: number; name: string; character: string }[];
  watchProviders: WatchProviders | null;
  externalRatings: ExternalRating[];
}

export interface AuthUser {
  id: string;
  email: string;
  country: string;
}

export interface ProfileDTO {
  id: string;
  name: string;
  avatarColor: string | null;
  defaultWatchProviderIds: number[];
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  activeProfile: ProfileDTO | null;
  profiles: ProfileDTO[];
}

export interface RatingDTO {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  value: number; // 1-5
  title: string;
  posterPath: string | null;
  genreIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistEntryDTO {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  createdAt: string;
}

export interface RecommendationsResponse {
  results: TitleSummary[];
  basedOn: {
    genreNames: string[];
  };
}
