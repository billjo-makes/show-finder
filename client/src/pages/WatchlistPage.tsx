import { useQueries, useQuery } from "@tanstack/react-query";
import type { TitleSummary, WatchlistEntryDTO } from "@show-finder/shared";
import { fetchWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { TitleCard } from "../components/TitleCard";

function toTitles(entries: WatchlistEntryDTO[]): TitleSummary[] {
  return entries.map((entry) => ({
    tmdbId: entry.tmdbId,
    mediaType: entry.mediaType,
    title: entry.title,
    overview: "",
    posterPath: entry.posterPath,
    genreIds: entry.genreIds,
    popularity: 0,
    voteAverage: 0,
    releaseDate: null,
  }));
}

export function WatchlistPage() {
  const { activeProfile, profiles } = useAuth();

  const ownWatchlistQuery = useQuery({
    queryKey: ["watchlist", activeProfile?.id],
    queryFn: () => fetchWatchlist(),
    enabled: Boolean(activeProfile) && !activeProfile?.isPrimary,
  });

  const allProfilesQueries = useQueries({
    queries: activeProfile?.isPrimary
      ? profiles.map((profile) => ({
          queryKey: ["watchlist", profile.id],
          queryFn: () => fetchWatchlist(profile.id),
        }))
      : [],
  });

  if (activeProfile?.isPrimary) {
    return (
      <div className="page">
        <h1>Watch List</h1>
        <p className="based-on-banner">
          You're the primary profile, so you can see and manage every profile's watch list here.
        </p>

        {profiles.map((profile, i) => {
          const query = allProfilesQueries[i];
          const titles = toTitles(query.data?.entries ?? []);
          return (
            <section key={profile.id} className="watchlist-profile-section">
              <h2>
                {profile.name}
                {profile.id === activeProfile.id && " (you)"}
              </h2>
              {query.isLoading && <p className="page-loading">Loading…</p>}
              {query.data && titles.length === 0 && (
                <p className="based-on-banner">Nothing here yet.</p>
              )}
              <div className="title-grid">
                {titles.map((title) => (
                  <TitleCard
                    key={`${title.mediaType}-${title.tmdbId}`}
                    title={title}
                    ownerProfileId={profile.id}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  const titles = toTitles(ownWatchlistQuery.data?.entries ?? []);

  return (
    <div className="page">
      <h1>Watch List</h1>

      {ownWatchlistQuery.isLoading && <p>Loading…</p>}
      {ownWatchlistQuery.error && <p className="form-error">Couldn't load your watch list.</p>}
      {ownWatchlistQuery.data && titles.length === 0 && (
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
