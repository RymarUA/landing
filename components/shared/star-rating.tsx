// @ts-nocheck
import { Star } from "lucide-react";

/**
 * StarRating component - відображає рейтинг зірками з підтримкою часткових зірок
 * Приклад: 4.5 = 4 повні + 1 напівзаповнена + 0 порожніх
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
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.3 && rating % 1 < 0.8;
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;
        
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              size={size}
              className={
                isFull
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200"
              }
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${size / 2}px` }}>
                <Star
                  size={size}
                  className="fill-amber-400 text-amber-400"
                />
              </div>
            )}
          </div>
        );
      })}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}
