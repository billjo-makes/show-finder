export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
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
}

export interface TitleDetail extends TitleSummary {
  genres: Genre[];
  releaseDate: string | null;
  runtime: number | null;
  cast: { id: number; name: string; character: string }[];
}

export interface AuthUser {
  id: string;
  email: string;
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

export interface RecommendationsResponse {
  results: TitleSummary[];
  basedOn: {
    genreNames: string[];
  };
}
