import type { Genre } from "@show-finder/shared";

interface GenreFilterProps {
  genres: Genre[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export function GenreFilter({ genres, selectedIds, onToggle }: GenreFilterProps) {
  return (
    <div className="genre-filter">
      {genres.map((genre) => (
        <button
          key={genre.id}
          type="button"
          className={`genre-chip ${selectedIds.includes(genre.id) ? "genre-chip-active" : ""}`}
          onClick={() => onToggle(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
