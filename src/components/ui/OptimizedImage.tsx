import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const widths = [320, 640, 960, 1280, 1920]
    // Assuming you have an image CDN that supports resizing
    // Replace with your actual image transformation logic
    return widths
      .filter((w) => w <= width * 2)
      .map((w) => `${baseSrc}?w=${w} ${w}w`)
      .join(", ")
  }

  useEffect(() => {
    if (priority && imgRef.current) {
      imgRef.current.fetchPriority = "high"
    }
  }, [priority])

  return (
    <div
      className={cn("relative overflow-hidden bg-zinc-100 dark:bg-zinc-800", className)}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-700" />
      )}

      <picture>
        {/* WebP version */}
        <source
          type="image/webp"
          srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/i, ".webp"))}
          sizes={sizes}
        />
        {/* Fallback */}
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      </picture>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
          <span className="text-sm">Failed to load</span>
        </div>
      )}
    </div>
  )
}

