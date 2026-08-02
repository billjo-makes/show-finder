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

const MIN_RATING_OPTIONS = [6, 7, 8, 9];

// Mirrors the TV exclusion the server applies for under-18 profiles (movies
// use a certification cap instead, so every movie genre stays selectable).
// Hiding these chips avoids a confusing empty result when a restricted
// profile picks a genre the server is going to exclude anyway.
const RESTRICTED_TV_GENRE_IDS = new Set([80, 10768]); // Crime, War & Politics

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "vote_count.desc", label: "Most voted" },
];

// TMDB's discover endpoint names the release-date sort field differently
// per media type (movies vs. TV), so build those two options dynamically.
function releaseDateSortOptions(mediaType: MediaType): { value: string; label: string }[] {
  const field = mediaType === "movie" ? "primary_release_date" : "first_air_date";
  return [
    { value: `${field}.desc`, label: "Newest" },
    { value: `${field}.asc`, label: "Oldest" },
  ];
}

export function BrowsePage() {
  const { activeProfile } = useAuth();
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>(
    activeProfile?.defaultWatchProviderIds ?? [],
  );
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [query, setQuery] = useState("");

  // Reset to the profile's default services whenever the active profile changes.
  useEffect(() => {
    setSelectedProviderIds(activeProfile?.defaultWatchProviderIds ?? []);
  }, [activeProfile?.id]);

  // The release-date sort field is named differently per media type
  // (primary_release_date vs. first_air_date), so remap it on toggle
  // instead of leaving a stale, invalid field name selected.
  useEffect(() => {
    setSortBy((prev) => {
      const [field, direction] = prev.split(".");
      if (field !== "primary_release_date" && field !== "first_air_date") return prev;
      const newField = mediaType === "movie" ? "primary_release_date" : "first_air_date";
      return `${newField}.${direction}`;
    });
  }, [mediaType]);

  const tvGenresRestricted = Boolean(activeProfile?.isUnder18) && mediaType === "tv";

  // Drop a genre from the selection if it becomes hidden (profile switched to
  // an under-18 one, or media type flipped to TV), so a stale chip can't keep
  // forcing an empty result set.
  useEffect(() => {
    if (!tvGenresRestricted) return;
    setSelectedGenreIds((prev) => prev.filter((id) => !RESTRICTED_TV_GENRE_IDS.has(id)));
  }, [tvGenresRestricted]);

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
      : ["discover", mediaType, selectedGenreIds, selectedProviderIds, originalLanguage, minRating, sortBy],
    queryFn: () =>
      query
        ? searchTitles(query)
        : discoverTitles(mediaType, genreIdsForQuery, {
            keywordIds: includeLgbtq ? [LGBTQ_KEYWORD_ID] : [],
            watchProviderIds: selectedProviderIds,
            originalLanguage: originalLanguage || undefined,
            minRating: minRating ? Number(minRating) : undefined,
            sortBy,
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
      {activeProfile?.isUnder18 && <p className="filter-label">Teen-safe filtering is on for this profile.</p>}
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
              genres={[
                ...genresQuery.data.genres.filter((g) => !(tvGenresRestricted && RESTRICTED_TV_GENRE_IDS.has(g.id))),
                { id: LGBTQ_CHIP_ID, name: "LGBTQ+" },
              ]}
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
          <div className="filter-row">
            {languagesQuery.data && (
              <div className="filter-group">
                <p className="filter-label">Original language</p>
                <select
                  className="select-filter"
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
              </div>
            )}
            <div className="filter-group">
              <p className="filter-label">Minimum TMDB rating</p>
              <select
                className="select-filter"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="">Any rating</option>
                {MIN_RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}+
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <p className="filter-label">Sort by</p>
              <select
                className="select-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {[...SORT_OPTIONS, ...releaseDateSortOptions(mediaType)].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
