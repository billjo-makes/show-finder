import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaType } from "@show-finder/shared";
import { SearchBar } from "../components/SearchBar";
import { GenreFilter } from "../components/GenreFilter";
import { TitleCard } from "../components/TitleCard";
import { discoverTitles, fetchGenres, searchTitles } from "../api/titles";

export function BrowsePage() {
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");

  const genresQuery = useQuery({
    queryKey: ["genres", mediaType],
    queryFn: () => fetchGenres(mediaType),
  });

  const resultsQuery = useQuery({
    queryKey: query ? ["search", query] : ["discover", mediaType, selectedGenreIds],
    queryFn: () =>
      query ? searchTitles(query) : discoverTitles(mediaType, selectedGenreIds),
  });

  function toggleGenre(id: number) {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
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
              genres={genresQuery.data.genres}
              selectedIds={selectedGenreIds}
              onToggle={toggleGenre}
            />
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
