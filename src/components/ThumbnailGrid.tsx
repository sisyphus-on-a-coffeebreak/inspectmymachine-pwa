import { useCallback, useState } from "react";
import { X } from "lucide-react";

type Item = {
  key: string;
  url: string;
  uploading?: boolean;
  progress?: number;
  onDelete?: () => void;   // per-item closure (no args)
  onError?: () => void;    // per-item image error handler
};

type Props = {
  items: Item[];
  onDelete?: (key: string) => void; // fallback handler
};

function isBustable(u: string) { return /^https?:\/\//i.test(u); }
function withCacheBuster(u: string, n = 0) {
  if (!isBustable(u) || n <= 0) return u;
  const [base, hash] = u.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}cb=${n}${hash ? `#${hash}` : ""}`;
}

export default function ThumbnailGrid({ items, onDelete }: Props) {
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});

  const bumpIfAllowed = useCallback((key: string, url: string) => {
    if (!isBustable(url)) return;
    setRetryMap((m) => {
      const next = (m[key] ?? 0) + 1;
      return next > 3 ? m : { ...m, [key]: next };
    });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ key, url, uploading, progress, onDelete: itemDelete, onError: itemOnError }) => {
        const tries = retryMap[key] ?? 0;
        const shownUrl = withCacheBuster(url, tries);

        const handleDelete = () => {
          if (itemDelete) itemDelete();
          else onDelete?.(key);
        };

        return (
          <div key={key} className="relative overflow-hidden rounded-md">
            <img
              src={shownUrl}
              alt=""
              loading="lazy"
              className="w-full h-28 object-cover select-none pointer-events-none"
              onError={() => {
                try { itemOnError?.(); } catch { /* no-op */ }
                bumpIfAllowed(key, url);
              }}
            />

            {uploading && (
              <div className="absolute left-2 bottom-2 z-40 rounded-full bg-black/70 text-white text-[10px] px-2 py-0.5">
                {typeof progress === "number" ? `${Math.max(2, progress)}%` : "…"}
              </div>
            )}

            {/* 30px circular X button — always visible, easy to tap */}
            <button
              type="button"
              aria-label="Delete photo"
              data-testid="thumb-delete"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
              onClick={(e) => { e.stopPropagation(); }} // noop fallback, prevents bubbling
              className="absolute top-2 right-2 z-50 h-[30px] w-[30px] rounded-full
                         bg-black/80 hover:bg-black/90 text-white flex items-center justify-center
                         shadow-lg ring-1 ring-white/30 pointer-events-auto active:scale-95 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
