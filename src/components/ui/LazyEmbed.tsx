import { useState } from "react"
import { Play } from "lucide-react"

interface LazyEmbedProps {
  type: "youtube" | "map" | "chat"
  embedId: string
  thumbnail?: string
  title: string
}

export function LazyEmbed({ type, embedId, thumbnail, title }: LazyEmbedProps) {
  const [loaded, setLoaded] = useState(false)

  const thumbnailUrl =
    thumbnail ||
    (type === "youtube" ? `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg` : undefined)

  const embedUrl = {
    youtube: `https://www.youtube.com/embed/${embedId}?autoplay=1`,
    map: `https://www.google.com/maps/embed?pb=${embedId}`,
    chat: "", // Your chat widget URL
  }[type]

  if (loaded) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className="w-full aspect-video rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <button
      onClick={() => setLoaded(true)}
      className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden group"
      aria-label={`Load ${title}`}
    >
      {thumbnailUrl && <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
        </div>
      </div>
      <span className="sr-only">Load {title}</span>
    </button>
  )
}

