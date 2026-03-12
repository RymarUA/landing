// @ts-nocheck
import { Star } from "lucide-react";

/**
 * StarRating component - відображає рейтинг зірками
 */
export function StarRating({ 
  rating, 
  count, 
  size = 11 
}: { 
  rating: number; 
  count: number; 
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}
