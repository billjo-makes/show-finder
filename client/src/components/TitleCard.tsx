import { Link } from "react-router-dom";
import type { TitleSummary } from "@show-finder/shared";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export function TitleCard({ title }: { title: TitleSummary }) {
  return (
    <Link to={`/title/${title.mediaType}/${title.tmdbId}`} className="title-card">
      <div className="title-card-poster">
        {title.posterPath ? (
          <img src={`${POSTER_BASE}${title.posterPath}`} alt={title.title} loading="lazy" />
        ) : (
          <div className="title-card-poster-fallback">No image</div>
        )}
      </div>
      <div className="title-card-name">{title.title}</div>
    </Link>
  );
}
