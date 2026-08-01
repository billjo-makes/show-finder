interface RatingControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RatingControl({ value, onChange, disabled }: RatingControlProps) {
  return (
    <div className="rating-control" role="radiogroup" aria-label="Rate this title">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? "star-filled" : ""}`}
          aria-checked={star === value}
          role="radio"
          disabled={disabled}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
