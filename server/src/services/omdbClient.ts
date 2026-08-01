import axios from "axios";
import type { ExternalRating } from "@show-finder/shared";
import { env } from "../env";

const omdbClient = axios.create({ baseURL: "https://www.omdbapi.com/" });

interface RawOmdbResponse {
  Response: "True" | "False";
  Ratings?: { Source: string; Value: string }[];
}

export async function fetchExternalRatings(imdbId: string | null): Promise<ExternalRating[]> {
  if (!imdbId || !env.OMDB_API_KEY) return [];

  try {
    const { data } = await omdbClient.get<RawOmdbResponse>("/", {
      params: { apikey: env.OMDB_API_KEY, i: imdbId },
    });
    if (data.Response === "False" || !Array.isArray(data.Ratings)) return [];
    return data.Ratings.map((r) => ({ source: r.Source, value: r.Value }));
  } catch {
    // OMDb is a nice-to-have; never let it break the title detail page.
    return [];
  }
}
