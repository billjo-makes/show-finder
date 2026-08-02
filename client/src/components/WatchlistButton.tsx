import { useEffect, useRef, useState } from "react";
import type { ProfileDTO } from "@show-finder/shared";

interface WatchlistButtonProps {
  onWatchlist: boolean;
  onToggle: () => void;
  disabled?: boolean;
  profiles?: ProfileDTO[];
  activeProfileId?: string;
  onAddToProfile?: (profileId: string) => void;
}

export function WatchlistButton({
  onWatchlist,
  onToggle,
  disabled,
  profiles,
  activeProfileId,
  onAddToProfile,
}: WatchlistButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProfile = profiles?.find((p) => p.id === activeProfileId);
  const showCaret = Boolean(
    profiles && profiles.length > 1 && activeProfileId && onAddToProfile && activeProfile?.isPrimary,
  );

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleProfileClick(profileId: string) {
    setMenuOpen(false);
    if (profileId === activeProfileId) {
      onToggle();
    } else {
      onAddToProfile?.(profileId);
    }
  }

  return (
    <div className="watchlist-button-group" ref={containerRef}>
      <button
        type="button"
        className={`watchlist-button ${onWatchlist ? "watchlist-button-active" : ""}`}
        aria-pressed={onWatchlist}
        aria-label={onWatchlist ? "Remove from watch list" : "Add to watch list"}
        title={onWatchlist ? "Remove from watch list" : "Add to watch list"}
        disabled={disabled}
        onClick={onToggle}
      >
        {onWatchlist ? "✓" : "+"}
      </button>

      {showCaret && (
        <button
          type="button"
          className="watchlist-button-caret"
          aria-label="Choose profile"
          aria-expanded={menuOpen}
          disabled={disabled}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ▾
        </button>
      )}

      {showCaret && menuOpen && (
        <ul className="watchlist-profile-menu" role="menu">
          {[...profiles!]
            .sort((a, b) => (a.id === activeProfileId ? -1 : b.id === activeProfileId ? 1 : 0))
            .map((profile) => (
            <li key={profile.id} role="menuitem">
              <button type="button" onClick={() => handleProfileClick(profile.id)}>
                {profile.id === activeProfileId ? (
                  <>
                    <span className="watchlist-profile-menu-check">{onWatchlist ? "✓" : ""}</span>
                    {profile.name} (you)
                  </>
                ) : (
                  <>
                    <span className="watchlist-profile-menu-check" />
                    Add to {profile.name}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
