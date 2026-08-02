import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TitleSummary } from "@show-finder/shared";
import { fetchRatings, rateTitle } from "../api/ratings";
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { RatingControl } from "./RatingControl";
import { WatchlistButton } from "./WatchlistButton";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

interface TitleCardProps {
  title: TitleSummary;
  // Profile this card's rating/watch-list state and actions apply to.
  // Defaults to the active profile; a primary profile viewing another
  // profile's section on the Watch List page passes that profile's id.
  ownerProfileId?: string;
}

export function TitleCard({ title, ownerProfileId }: TitleCardProps) {
  const queryClient = useQueryClient();
  const { activeProfile, profiles } = useAuth();
  const ownerId = ownerProfileId ?? activeProfile?.id;
  const isOwnProfile = !ownerProfileId || ownerProfileId === activeProfile?.id;

  const ratingsQuery = useQuery({
    queryKey: ["ratings", ownerId],
    queryFn: () => fetchRatings(ownerId),
    enabled: Boolean(ownerId),
  });
  const existingValue =
    ratingsQuery.data?.ratings.find(
      (r) => r.tmdbId === title.tmdbId && r.mediaType === title.mediaType,
    )?.value ?? 0;

  const watchlistQuery = useQuery({
    queryKey: ["watchlist", ownerId],
    queryFn: () => fetchWatchlist(ownerId),
    enabled: Boolean(ownerId),
  });
  const watchlistEntry = watchlistQuery.data?.entries.find(
    (e) => e.tmdbId === title.tmdbId && e.mediaType === title.mediaType,
  );

  const rateMutation = useMutation({
    mutationFn: rateTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["watchlist", ownerId] });
    },
  });

  const addWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", ownerId] });
    },
  });

  const removeWatchlistMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", ownerId] });
    },
  });

  const addToProfileMutation = useMutation({
    mutationFn: (profileId: string) =>
      addToWatchlist({
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        posterPath: title.posterPath,
        genreIds: title.genreIds,
        profileId,
      }),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", profileId] });
    },
  });

  function handleRate(value: number) {
    rateMutation.mutate({
      tmdbId: title.tmdbId,
      mediaType: title.mediaType,
      value,
      title: title.title,
      posterPath: title.posterPath,
      genreIds: title.genreIds,
      profileId: ownerId,
    });
  }

  function handleToggleWatchlist() {
    if (watchlistEntry) {
      removeWatchlistMutation.mutate(watchlistEntry.id);
    } else {
      addWatchlistMutation.mutate({
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        posterPath: title.posterPath,
        genreIds: title.genreIds,
        profileId: ownerId,
      });
    }
  }

  return (
    <div className="title-card">
      <div className="title-card-poster-wrap">
        <Link to={`/title/${title.mediaType}/${title.tmdbId}`} className="title-card-poster">
          {title.posterPath ? (
            <img src={`${POSTER_BASE}${title.posterPath}`} alt={title.title} loading="lazy" />
          ) : (
            <div className="title-card-poster-fallback">No image</div>
          )}
        </Link>

        {existingValue > 0 && (
          <span className="title-card-rated-badge">{"★".repeat(existingValue)}</span>
        )}

        <WatchlistButton
          onWatchlist={Boolean(watchlistEntry)}
          onToggle={handleToggleWatchlist}
          disabled={addWatchlistMutation.isPending || removeWatchlistMutation.isPending}
          profiles={isOwnProfile ? profiles : undefined}
          activeProfileId={isOwnProfile ? activeProfile?.id : undefined}
          onAddToProfile={isOwnProfile ? (profileId) => addToProfileMutation.mutate(profileId) : undefined}
        />

        <div className="title-card-rating-overlay">
          <RatingControl value={existingValue} onChange={handleRate} disabled={rateMutation.isPending} />
        </div>
      </div>
      <Link to={`/title/${title.mediaType}/${title.tmdbId}`} className="title-card-name">
        {title.title}
        {title.releaseDate && <span className="title-card-year"> ({title.releaseDate.slice(0, 4)})</span>}
      </Link>
    </div>
  );
}
