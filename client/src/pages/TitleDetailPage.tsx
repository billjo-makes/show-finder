import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MediaType } from "@show-finder/shared";
import { fetchSimilarTitles, fetchTitleDetail } from "../api/titles";
import { fetchRatings, rateTitle } from "../api/ratings";
import { useAuth } from "../auth/AuthContext";
import { RatingControl } from "../components/RatingControl";
import { TitleCard } from "../components/TitleCard";

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export function TitleDetailPage() {
  const { mediaType, id } = useParams<{ mediaType: MediaType; id: string }>();
  const tmdbId = Number(id);
  const queryClient = useQueryClient();
  const { activeProfile } = useAuth();

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
    queryFn: fetchRatings,
    enabled: Boolean(activeProfile),
  });
  const existingRating = ratingsQuery.data?.ratings.find(
    (r) => r.tmdbId === tmdbId && r.mediaType === mediaType,
  );

  const rateMutation = useMutation({
    mutationFn: rateTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", activeProfile?.id] });
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

  return (
    <div className="page title-detail">
      <div className="title-detail-header">
        {title.posterPath && <img src={`${POSTER_BASE}${title.posterPath}`} alt={title.title} />}
        <div>
          <h1>{title.title}</h1>
          <p className="title-detail-meta">
            {title.releaseDate?.slice(0, 4)} · {title.genres.map((g) => g.name).join(", ")}
            {title.runtime ? ` · ${title.runtime} min` : ""}
          </p>
          <p>{title.overview}</p>
          <RatingControl value={existingRating?.value ?? 0} onChange={handleRate} />
        </div>
      </div>

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
