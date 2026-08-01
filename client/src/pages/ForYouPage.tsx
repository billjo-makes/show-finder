import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaType } from "@show-finder/shared";
import { fetchRecommendations } from "../api/ratings";
import { TitleCard } from "../components/TitleCard";

export function ForYouPage() {
  const [mediaType, setMediaType] = useState<MediaType>("movie");

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", mediaType],
    queryFn: () => fetchRecommendations(mediaType),
  });

  return (
    <div className="page">
      <h1>For You</h1>
      <div className="media-type-toggle">
        <button className={mediaType === "movie" ? "active" : ""} onClick={() => setMediaType("movie")}>
          Movies
        </button>
        <button className={mediaType === "tv" ? "active" : ""} onClick={() => setMediaType("tv")}>
          TV Shows
        </button>
      </div>

      {recommendationsQuery.data && (
        <p className="based-on-banner">
          {recommendationsQuery.data.basedOn.genreNames.length > 0
            ? `Because you rated ${recommendationsQuery.data.basedOn.genreNames.join(", ")} highly`
            : "Rate a few titles to get personalized picks — showing what's trending for now."}
        </p>
      )}

      {recommendationsQuery.isLoading && <p>Loading…</p>}
      {recommendationsQuery.error && <p className="form-error">Couldn't load recommendations.</p>}

      <div className="title-grid">
        {recommendationsQuery.data?.results.map((title) => (
          <TitleCard key={`${title.mediaType}-${title.tmdbId}`} title={title} />
        ))}
      </div>
    </div>
  );
}
