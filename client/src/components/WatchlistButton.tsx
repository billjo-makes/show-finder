interface WatchlistButtonProps {
  onWatchlist: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function WatchlistButton({ onWatchlist, onToggle, disabled }: WatchlistButtonProps) {
  return (
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
  );
}
