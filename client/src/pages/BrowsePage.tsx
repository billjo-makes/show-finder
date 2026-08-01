import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaType } from "@show-finder/shared";
import { SearchBar } from "../components/SearchBar";
import { GenreFilter } from "../components/GenreFilter";
import { WatchProviderFilter } from "../components/WatchProviderFilter";
import { TitleCard } from "../components/TitleCard";
import { discoverTitles, fetchGenres, fetchLanguages, fetchWatchProviders, searchTitles } from "../api/titles";
import { useAuth } from "../auth/AuthContext";

// TMDB has no dedicated LGBTQ+ genre, so this chip filters by keyword instead
// of genre id. It's represented locally with a sentinel id that can't collide
// with a real TMDB genre id.
const LGBTQ_CHIP_ID = -1;
const LGBTQ_KEYWORD_ID = 158718;

export function BrowsePage() {
  const { activeProfile } = useAuth();
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>(
    activeProfile?.defaultWatchProviderIds ?? [],
  );
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [query, setQuery] = useState("");

  // Reset to the profile's default services whenever the active profile changes.
  useEffect(() => {
    setSelectedProviderIds(activeProfile?.defaultWatchProviderIds ?? []);
  }, [activeProfile?.id]);

  const genresQuery = useQuery({
    queryKey: ["genres", mediaType],
    queryFn: () => fetchGenres(mediaType),
  });

  const providersQuery = useQuery({
    queryKey: ["watch-providers", mediaType],
    queryFn: () => fetchWatchProviders(mediaType),
  });

  const languagesQuery = useQuery({
    queryKey: ["languages"],
    queryFn: fetchLanguages,
  });

  const includeLgbtq = selectedGenreIds.includes(LGBTQ_CHIP_ID);
  const genreIdsForQuery = selectedGenreIds.filter((id) => id !== LGBTQ_CHIP_ID);

  const resultsQuery = useQuery({
    queryKey: query
      ? ["search", query]
      : ["discover", mediaType, selectedGenreIds, selectedProviderIds, originalLanguage],
    queryFn: () =>
      query
        ? searchTitles(query)
        : discoverTitles(mediaType, genreIdsForQuery, {
            keywordIds: includeLgbtq ? [LGBTQ_KEYWORD_ID] : [],
            watchProviderIds: selectedProviderIds,
            originalLanguage: originalLanguage || undefined,
          }),
  });

  function toggleGenre(id: number) {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  function toggleProvider(id: number) {
    setSelectedProviderIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function handleSearch(newQuery: string) {
    setQuery(newQuery);
  }

  return (
    <div className="page">
      <h1>Browse</h1>
      <SearchBar onSearch={handleSearch} />

      {!query && (
        <>
          <div className="media-type-toggle">
            <button
              className={mediaType === "movie" ? "active" : ""}
              onClick={() => setMediaType("movie")}
            >
              Movies
            </button>
            <button className={mediaType === "tv" ? "active" : ""} onClick={() => setMediaType("tv")}>
              TV Shows
            </button>
          </div>
          {genresQuery.data && (
            <GenreFilter
              genres={[...genresQuery.data.genres, { id: LGBTQ_CHIP_ID, name: "LGBTQ+" }]}
              selectedIds={selectedGenreIds}
              onToggle={toggleGenre}
            />
          )}
          {providersQuery.data && providersQuery.data.providers.length > 0 && (
            <>
              <p className="filter-label">Where to watch</p>
              <WatchProviderFilter
                providers={providersQuery.data.providers}
                selectedIds={selectedProviderIds}
                onToggle={toggleProvider}
              />
            </>
          )}
          {languagesQuery.data && (
            <>
              <p className="filter-label">Original language</p>
              <select
                className="language-filter"
                value={originalLanguage}
                onChange={(e) => setOriginalLanguage(e.target.value)}
              >
                <option value="">Any language</option>
                {languagesQuery.data.languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      )}

      {resultsQuery.isLoading && <p>Loading…</p>}
      {resultsQuery.error && <p className="form-error">Couldn't load titles.</p>}

      <div className="title-grid">
        {resultsQuery.data?.results.map((title) => (
          <TitleCard key={`${title.mediaType}-${title.tmdbId}`} title={title} />
        ))}
      </div>
    </div>
  );
}
