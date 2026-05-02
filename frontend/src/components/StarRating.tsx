import { Star } from "lucide-react"
import { clsx } from "clsx"

interface StarRatingProps {
  rating: number
  reviewCount?: number
  size?: "sm" | "md" | "lg"
  showCount?: boolean
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export default function StarRating({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={clsx(
              sizeMap[size],
              i < fullStars
                ? "fill-amber-400 text-amber-400"
                : hasHalf && i === fullStars
                ? "fill-amber-200 text-amber-400"
                : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-neutral-500">
          {rating.toFixed(1)} ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}
