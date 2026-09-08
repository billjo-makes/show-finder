import { useQuery } from "@tanstack/react-query";
import type { WatchProvider } from "@show-finder/shared";
import { fetchWatchProviders } from "../api/titles";
import { TopServiceRail } from "../components/TopServiceRail";

// TMDB's provider catalog is fetched live and region-aware (same endpoint
// the Browse page's provider filter uses), so services here are matched by
// name rather than a hardcoded id — ids are generally stable, but display
// names have changed before (HBO Max was renamed "Max" and back again) and
// a service's id/availability can differ by country.
const FEATURED_SERVICES: { label: string; aliases: string[] }[] = [
  { label: "Netflix", aliases: ["netflix"] },
  { label: "HBO Max", aliases: ["hbo max", "max"] },
  { label: "Disney+", aliases: ["disney plus", "disney+"] },
  { label: "Apple TV+", aliases: ["apple tv", "apple tv plus", "apple tv+"] },
];

function findProvider(providers: WatchProvider[], aliases: string[]): WatchProvider | undefined {
  return providers.find((p) => aliases.includes(p.providerName.trim().toLowerCase()));
}

export function TopStreamingPage() {
  const providersQuery = useQuery({
    queryKey: ["watch-providers", "movie"],
    queryFn: () => fetchWatchProviders("movie"),
  });

  const providers = providersQuery.data?.providers ?? [];

  return (
    <div className="page">
      <h1>Top Streaming</h1>
      <p className="filter-label">The most popular movies included with each subscription right now.</p>

      {providersQuery.isLoading && <p>Loading…</p>}
      {providersQuery.error && <p className="form-error">Couldn't load streaming services.</p>}

      {providersQuery.data &&
        FEATURED_SERVICES.map((service) => (
          <TopServiceRail
            key={service.label}
            label={service.label}
            provider={findProvider(providers, service.aliases)}
          />
        ))}
    </div>
  );
}
