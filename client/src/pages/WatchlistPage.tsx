import { useQuery } from "@tanstack/react-query";
import type { TitleSummary } from "@show-finder/shared";
import { fetchWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { TitleCard } from "../components/TitleCard";

export function WatchlistPage() {
  const { activeProfile } = useAuth();

  const watchlistQuery = useQuery({
    queryKey: ["watchlist", activeProfile?.id],
    queryFn: fetchWatchlist,
    enabled: Boolean(activeProfile),
  });

  const titles: TitleSummary[] =
    watchlistQuery.data?.entries.map((entry) => ({
      tmdbId: entry.tmdbId,
      mediaType: entry.mediaType,
      title: entry.title,
      overview: "",
      posterPath: entry.posterPath,
      genreIds: entry.genreIds,
      popularity: 0,
      voteAverage: 0,
      releaseDate: null,
    })) ?? [];

  return (
    <div className="page">
      <h1>Watch List</h1>

      {watchlistQuery.isLoading && <p>Loading…</p>}
      {watchlistQuery.error && <p className="form-error">Couldn't load your watch list.</p>}
      {watchlistQuery.data && titles.length === 0 && (
        <p className="based-on-banner">
          Nothing here yet — tap the + on a title to add it to your watch list.
        </p>
      )}

      <div className="title-grid">
        {titles.map((title) => (
          <TitleCard key={`${title.mediaType}-${title.tmdbId}`} title={title} />
        ))}
      </div>
    </div>
  );
}
