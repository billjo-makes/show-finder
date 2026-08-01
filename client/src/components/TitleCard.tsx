import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TitleSummary } from "@show-finder/shared";
import { fetchRatings, rateTitle } from "../api/ratings";
import { RatingControl } from "./RatingControl";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export function TitleCard({ title }: { title: TitleSummary }) {
  const queryClient = useQueryClient();
  const ratingsQuery = useQuery({ queryKey: ["ratings"], queryFn: fetchRatings });
  const existingValue =
    ratingsQuery.data?.ratings.find(
      (r) => r.tmdbId === title.tmdbId && r.mediaType === title.mediaType,
    )?.value ?? 0;

  const rateMutation = useMutation({
    mutationFn: rateTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
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

        <div className="title-card-rating-overlay">
          <RatingControl value={existingValue} onChange={handleRate} disabled={rateMutation.isPending} />
        </div>
      </div>
      <Link to={`/title/${title.mediaType}/${title.tmdbId}`} className="title-card-name">
        {title.title}
      </Link>
    </div>
  );
}
