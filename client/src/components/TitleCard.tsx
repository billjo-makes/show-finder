import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TitleSummary } from "@show-finder/shared";
import { fetchRatings, rateTitle } from "../api/ratings";
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { RatingControl } from "./RatingControl";
import { WatchlistButton } from "./WatchlistButton";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export function TitleCard({ title }: { title: TitleSummary }) {
  const queryClient = useQueryClient();
  const { activeProfile, profiles } = useAuth();
  const ratingsQuery = useQuery({
    queryKey: ["ratings", activeProfile?.id],
    queryFn: fetchRatings,
    enabled: Boolean(activeProfile),
  });
  const existingValue =
    ratingsQuery.data?.ratings.find(
      (r) => r.tmdbId === title.tmdbId && r.mediaType === title.mediaType,
    )?.value ?? 0;

  const watchlistQuery = useQuery({
    queryKey: ["watchlist", activeProfile?.id],
    queryFn: fetchWatchlist,
    enabled: Boolean(activeProfile),
  });
  const watchlistEntry = watchlistQuery.data?.entries.find(
    (e) => e.tmdbId === title.tmdbId && e.mediaType === title.mediaType,
  );

  const rateMutation = useMutation({
    mutationFn: rateTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["watchlist", activeProfile?.id] });
    },
  });

  const addWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", activeProfile?.id] });
    },
  });

  const removeWatchlistMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", activeProfile?.id] });
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
          profiles={profiles}
          activeProfileId={activeProfile?.id}
          onAddToProfile={(profileId) => addToProfileMutation.mutate(profileId)}
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
