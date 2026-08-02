import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { WatchProvider } from "@show-finder/shared";
import { deleteRating, fetchRatings } from "../api/ratings";
import { fetchWatchProviders } from "../api/titles";
import { updateProfile } from "../api/profiles";
import { useAuth } from "../auth/AuthContext";
import { WatchProviderFilter } from "../components/WatchProviderFilter";

const POSTER_BASE = "https://image.tmdb.org/t/p/w154";

const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "IE", name: "Ireland" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

export function AccountPage() {
  const queryClient = useQueryClient();
  const { user, activeProfile, updateCountry, refreshProfiles } = useAuth();

  const movieProvidersQuery = useQuery({
    queryKey: ["watch-providers", "movie"],
    queryFn: () => fetchWatchProviders("movie"),
  });
  const tvProvidersQuery = useQuery({
    queryKey: ["watch-providers", "tv"],
    queryFn: () => fetchWatchProviders("tv"),
  });
  const allProviders = useMemo(() => {
    // Both lists already come from the server sorted by popularity; append
    // TV-only providers after the movie list so that ordering is preserved.
    const byId = new Map<number, WatchProvider>();
    for (const p of movieProvidersQuery.data?.providers ?? []) byId.set(p.providerId, p);
    for (const p of tvProvidersQuery.data?.providers ?? []) {
      if (!byId.has(p.providerId)) byId.set(p.providerId, p);
    }
    return [...byId.values()];
  }, [movieProvidersQuery.data, tvProvidersQuery.data]);

  const defaultProvidersMutation = useMutation({
    mutationFn: (defaultWatchProviderIds: number[]) =>
      updateProfile(activeProfile!.id, { defaultWatchProviderIds }),
    onSuccess: () => refreshProfiles(),
  });

  function toggleDefaultProvider(providerId: number) {
    if (!activeProfile) return;
    const current = activeProfile.defaultWatchProviderIds;
    const next = current.includes(providerId)
      ? current.filter((id) => id !== providerId)
      : [...current, providerId];
    defaultProvidersMutation.mutate(next);
  }

  const ratingsQuery = useQuery({
    queryKey: ["ratings", activeProfile?.id],
    queryFn: () => fetchRatings(),
    enabled: Boolean(activeProfile),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", activeProfile?.id] });
    },
  });

  const countryMutation = useMutation({
    mutationFn: updateCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["title"] });
    },
  });

  return (
    <div className="page">
      <h1>Account</h1>
      <p className="account-meta">
        {user?.email} · Profile: {activeProfile?.name ?? "—"}
      </p>

      <h2>Region</h2>
      <p className="account-region-hint">Where you watch from — used to show streaming availability.</p>
      <select
        value={user?.country ?? "US"}
        onChange={(e) => countryMutation.mutate(e.target.value)}
        disabled={countryMutation.isPending}
      >
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      <h2>Default Streaming Services</h2>
      <p className="account-region-hint">
        Pre-select these services when Browse loads for {activeProfile?.name ?? "this profile"}.
      </p>
      {allProviders.length > 0 && activeProfile && (
        <WatchProviderFilter
          providers={allProviders}
          selectedIds={activeProfile.defaultWatchProviderIds}
          onToggle={toggleDefaultProvider}
        />
      )}

      <h2>My Ratings</h2>
      {ratingsQuery.isLoading && <p>Loading…</p>}
      {ratingsQuery.data?.ratings.length === 0 && <p>You haven't rated anything yet.</p>}

      <ul className="ratings-list">
        {ratingsQuery.data?.ratings.map((rating) => (
          <li key={rating.id} className="ratings-list-item">
            <Link to={`/title/${rating.mediaType}/${rating.tmdbId}`} className="ratings-list-poster">
              {rating.posterPath ? (
                <img src={`${POSTER_BASE}${rating.posterPath}`} alt={rating.title} />
              ) : (
                <div className="title-card-poster-fallback">No image</div>
              )}
            </Link>
            <div className="ratings-list-info">
              <Link to={`/title/${rating.mediaType}/${rating.tmdbId}`}>{rating.title}</Link>
              <span>{"★".repeat(rating.value)}</span>
            </div>
            <button onClick={() => deleteMutation.mutate(rating.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
