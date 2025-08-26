import { useState, useCallback } from "react";
import { X } from "lucide-react";

type ThumbItem = { key: string; url: string };

interface Props {
  items: ThumbItem[];
  onDelete?: (key: string) => void;
}

function withCacheBuster(url: string, n: number) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}cb=${n}`;
}

export default function ThumbnailGrid({ items, onDelete }: Props) {
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});

  const bump = useCallback((key: string) => {
    setRetryMap((m) => ({ ...m, [key]: (m[key] ?? 0) + 1 }));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ key, url }) => (
        <div key={key} className="relative group overflow-hidden rounded-md">
          <img
            src={withCacheBuster(url, retryMap[key] ?? 0)}
            className="w-full h-28 object-cover pointer-events-none select-none"
            onError={() => bump(key)}
            alt=""
          />
          <button
            type="button"
            data-testid="thumb-delete"
            aria-label="Delete photo"
            onClick={() => onDelete?.(key)}
            disabled={!onDelete}
            className="absolute top-1.5 right-1.5 z-20 h-11 w-11 rounded-full bg-black/70 text-white flex items-center justify-center shadow ring-1 ring-white/20 pointer-events-auto disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
