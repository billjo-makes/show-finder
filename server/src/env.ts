import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required — sign up at https://www.themoviedb.org/ and generate a v3 API key"),
  // Optional: without it, external ratings (IMDb/Rotten Tomatoes/Metacritic) are omitted.
  // Get a free key at https://www.omdbapi.com/apikey.aspx
  OMDB_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
