import { useQuery } from "@tanstack/react-query";
import type { WatchProvider } from "@show-finder/shared";
import { discoverTitles } from "../api/titles";
import { TitleCard } from "./TitleCard";

const LOGO_BASE = "https://image.tmdb.org/t/p/w45";
const RAIL_SIZE = 10;

interface TopServiceRailProps {
  label: string;
  // Undefined when this service wasn't found in the region's provider
  // catalog (name changed, or not offered in the account's country).
  provider: WatchProvider | undefined;
}

// One horizontal rail of the most popular movies currently included with a
// subscription to a given streaming service. "Included with a subscription"
// is enforced via watchMonetizationTypes=flatrate, which excludes titles
// only available to rent or buy on that provider.
export function TopServiceRail({ label, provider }: TopServiceRailProps) {
  const resultsQuery = useQuery({
    queryKey: ["top-streaming", provider?.providerId],
    queryFn: () =>
      discoverTitles("movie", [], {
        watchProviderIds: [provider!.providerId],
        watchMonetizationTypes: ["flatrate"],
        sortBy: "popularity.desc",
      }),
    enabled: Boolean(provider),
  });

  return (
    <section className="service-rail">
      <div className="service-rail-header">
        {provider?.logoPath && (
          <img src={`${LOGO_BASE}${provider.logoPath}`} alt="" className="service-rail-logo" />
        )}
        <h2>{label}</h2>
      </div>

      {!provider && <p className="filter-label">Not available in your region.</p>}
      {resultsQuery.isLoading && <p>Loading…</p>}
      {resultsQuery.error && <p className="form-error">Couldn't load titles.</p>}

      <div className="service-rail-row">
        {resultsQuery.data?.results.slice(0, RAIL_SIZE).map((title) => (
          <div className="service-rail-item" key={`${title.mediaType}-${title.tmdbId}`}>
            <TitleCard title={title} />
          </div>
        ))}
      </div>
    </section>
  );
}
