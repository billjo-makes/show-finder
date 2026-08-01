import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteRating, fetchRatings } from "../api/ratings";

const POSTER_BASE = "https://image.tmdb.org/t/p/w154";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const ratingsQuery = useQuery({ queryKey: ["ratings"], queryFn: fetchRatings });

  const deleteMutation = useMutation({
    mutationFn: deleteRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  return (
    <div className="page">
      <h1>My Ratings</h1>
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
