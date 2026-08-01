import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteRating, fetchRatings } from "../api/ratings";
import { useAuth } from "../auth/AuthContext";

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
  const { user, activeProfile, updateCountry } = useAuth();
  const ratingsQuery = useQuery({
    queryKey: ["ratings", activeProfile?.id],
    queryFn: fetchRatings,
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
