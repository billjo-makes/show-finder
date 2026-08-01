import { useState } from "react";
import type { WatchProvider } from "@show-finder/shared";

const LOGO_BASE = "https://image.tmdb.org/t/p/w45";
const DEFAULT_VISIBLE_COUNT = 12;

interface WatchProviderFilterProps {
  providers: WatchProvider[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

// TMDB returns every provider registered in a region — including dozens of
// niche ones — sorted by popularity (display_priority). Collapse to the most
// popular ones by default rather than dumping the full list on the page.
export function WatchProviderFilter({ providers, selectedIds, onToggle }: WatchProviderFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = providers.length > DEFAULT_VISIBLE_COUNT;
  const visibleProviders = expanded ? providers : providers.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="provider-filter">
      {visibleProviders.map((provider) => (
        <button
          key={provider.providerId}
          type="button"
          className={`provider-chip ${selectedIds.includes(provider.providerId) ? "provider-chip-active" : ""}`}
          onClick={() => onToggle(provider.providerId)}
          title={provider.providerName}
        >
          {provider.logoPath && (
            <img src={`${LOGO_BASE}${provider.logoPath}`} alt="" className="provider-chip-logo" />
          )}
          {provider.providerName}
        </button>
      ))}
      {hasMore && (
        <button
          type="button"
          className="provider-chip provider-chip-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : `+${providers.length - DEFAULT_VISIBLE_COUNT} more`}
        </button>
      )}
    </div>
  );
}
