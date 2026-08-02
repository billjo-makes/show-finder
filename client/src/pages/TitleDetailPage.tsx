import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MediaType } from "@show-finder/shared";
import { fetchSimilarTitles, fetchTitleDetail } from "../api/titles";
import { fetchRatings, rateTitle } from "../api/ratings";
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { RatingControl } from "../components/RatingControl";
import { TitleCard } from "../components/TitleCard";
import { WatchlistButton } from "../components/WatchlistButton";

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const PROVIDER_LOGO_BASE = "https://image.tmdb.org/t/p/w45";

const languageDisplayNames =
  typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "language" }) : null;

function languageName(code: string | null) {
  if (!code) return null;
  try {
    return languageDisplayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function TitleDetailPage() {
  const { mediaType, id } = useParams<{ mediaType: MediaType; id: string }>();
  const tmdbId = Number(id);
  const queryClient = useQueryClient();
  const { activeProfile, profiles } = useAuth();

  const detailQuery = useQuery({
    queryKey: ["title", mediaType, tmdbId],
    queryFn: () => fetchTitleDetail(mediaType!, tmdbId),
    enabled: Boolean(mediaType && tmdbId),
  });

  const similarQuery = useQuery({
    queryKey: ["similar", mediaType, tmdbId],
    queryFn: () => fetchSimilarTitles(mediaType!, tmdbId),
    enabled: Boolean(mediaType && tmdbId),
  });

  const ratingsQuery = useQuery({
    queryKey: ["ratings", activeProfile?.id],
    queryFn: () => fetchRatings(),
    enabled: Boolean(activeProfile),
  });
  const existingRating = ratingsQuery.data?.ratings.find(
    (r) => r.tmdbId === tmdbId && r.mediaType === mediaType,
  );

  const watchlistQuery = useQuery({
    queryKey: ["watchlist", activeProfile?.id],
    queryFn: () => fetchWatchlist(),
    enabled: Boolean(activeProfile),
  });
  const watchlistEntry = watchlistQuery.data?.entries.find(
    (e) => e.tmdbId === tmdbId && e.mediaType === mediaType,
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
        tmdbId,
        mediaType: mediaType!,
        title: detailQuery.data!.title,
        posterPath: detailQuery.data!.posterPath,
        genreIds: detailQuery.data!.genres.map((g) => g.id),
        profileId,
      }),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", profileId] });
    },
  });

  if (detailQuery.isLoading) return <p className="page-loading">Loading…</p>;
  if (detailQuery.error || !detailQuery.data) return <p className="form-error">Couldn't load this title.</p>;

  const title = detailQuery.data;

  function handleRate(value: number) {
    rateMutation.mutate({
      tmdbId: title.tmdbId,
      mediaType: title.mediaType,
      value,
      title: title.title,
      posterPath: title.posterPath,
      genreIds: title.genres.map((g) => g.id),
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
        genreIds: title.genres.map((g) => g.id),
      });
    }
  }

  return (
    <div className="page title-detail">
      <div className="title-detail-header">
        {title.posterPath && <img src={`${POSTER_BASE}${title.posterPath}`} alt={title.title} />}
        <div>
          <h1>{title.title}</h1>
          <p className="title-detail-meta">
            {title.releaseDate?.slice(0, 4)} · {title.genres.map((g) => g.name).join(", ")}
            {title.runtime ? ` · ${title.runtime} min` : ""}
            {languageName(title.originalLanguage) ? ` · ${languageName(title.originalLanguage)}` : ""}
          </p>
          {title.externalRatings.length > 0 && (
            <p className="external-ratings-row">
              {title.externalRatings.map((rating) => (
                <span key={rating.source} className="external-rating-badge">
                  <strong>{rating.source}</strong> {rating.value}
                </span>
              ))}
            </p>
          )}
          <p>{title.overview}</p>
          <div className="title-detail-actions">
            <RatingControl value={existingRating?.value ?? 0} onChange={handleRate} />
            <WatchlistButton
              onWatchlist={Boolean(watchlistEntry)}
              onToggle={handleToggleWatchlist}
              disabled={addWatchlistMutation.isPending || removeWatchlistMutation.isPending}
              profiles={profiles}
              activeProfileId={activeProfile?.id}
              onAddToProfile={(profileId) => addToProfileMutation.mutate(profileId)}
            />
          </div>
          {existingRating && (
            <p className="title-detail-rated-on">
              Rated on {new Date(existingRating.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {title.watchProviders &&
        (title.watchProviders.flatrate.length > 0 ||
          title.watchProviders.rent.length > 0 ||
          title.watchProviders.buy.length > 0) && (
          <section>
            <h2>Where to watch</h2>
            {title.watchProviders.flatrate.length > 0 && (
              <p className="watch-providers-row">
                <span className="watch-providers-label">Stream:</span>
                {title.watchProviders.flatrate.map((p) => (
                  <img
                    key={p.providerId}
                    src={`${PROVIDER_LOGO_BASE}${p.logoPath}`}
                    alt={p.providerName}
                    title={p.providerName}
                    className="watch-provider-logo"
                  />
                ))}
              </p>
            )}
            {title.watchProviders.rent.length > 0 && (
              <p className="watch-providers-row">
                <span className="watch-providers-label">Rent:</span>
                {title.watchProviders.rent.map((p) => (
                  <img
                    key={p.providerId}
                    src={`${PROVIDER_LOGO_BASE}${p.logoPath}`}
                    alt={p.providerName}
                    title={p.providerName}
                    className="watch-provider-logo"
                  />
                ))}
              </p>
            )}
            {title.watchProviders.buy.length > 0 && (
              <p className="watch-providers-row">
                <span className="watch-providers-label">Buy:</span>
                {title.watchProviders.buy.map((p) => (
                  <img
                    key={p.providerId}
                    src={`${PROVIDER_LOGO_BASE}${p.logoPath}`}
                    alt={p.providerName}
                    title={p.providerName}
                    className="watch-provider-logo"
                  />
                ))}
              </p>
            )}
            <p className="watch-providers-attribution">
              Streaming data provided by{" "}
              {title.watchProviders.link ? (
                <a href={title.watchProviders.link} target="_blank" rel="noreferrer">
                  JustWatch
                </a>
              ) : (
                "JustWatch"
              )}
            </p>
          </section>
        )}

      {title.cast.length > 0 && (
        <section>
          <h2>Cast</h2>
          <p className="cast-list">{title.cast.map((c) => c.name).join(", ")}</p>
        </section>
      )}

      {similarQuery.data && similarQuery.data.results.length > 0 && (
        <section>
          <h2>More like this</h2>
          <div className="title-grid">
            {similarQuery.data.results.map((t) => (
              <TitleCard key={`${t.mediaType}-${t.tmdbId}`} title={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
