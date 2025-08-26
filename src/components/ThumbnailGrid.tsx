import { useCallback, useState } from "react";
import { X } from "lucide-react";

type Item = {
  key: string;
  url: string;
  uploading?: boolean;
  progress?: number;
  onDelete?: () => void;
  onError?: () => void;
};

type Props = {
  items: Item[];
  onDelete?: (key: string) => void;
};

function withStableParam(url: string, key: string) {
  try {
    if (url.startsWith("blob:")) return url; // don’t touch blobs
    const u = new URL(url);
    // one deterministic param; never increments
    u.searchParams.set("v", key);
    return u.toString();
  } catch {
    return url; // blob: or malformed → fallback
  }
}

// only bust caches for real http(s) URLs (NOT blob: / data:)
function isBustable(u: string) {
  return /^https?:\/\//i.test(u);
}
function withCacheBuster(u: string, n = 0) {
  if (!isBustable(u) || n <= 0) return u;
  const [base, hash] = u.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}cb=${n}${hash ? `#${hash}` : ""}`;
}

export default function ThumbnailGrid({ items, onDelete }: Props) {
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});

  const bumpIfAllowed = useCallback((key: string, url: string) => {
    // Don’t bump blob/data URLs; cap retries to avoid loops on bad links
    if (!isBustable(url)) return;
    setRetryMap((m) => {
      const next = (m[key] ?? 0) + 1;
      return next > 3 ? m : { ...m, [key]: next };
    });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
            {items.map(({ key, url, uploading, progress, onDelete: itemDelete, onError: itemError }) => {
                const tries = retryMap[key] ?? 0;
                const stableUrl = withStableParam(url, key);
                const shownUrl = withCacheBuster(stableUrl, tries);

                return (
                  <div key={key} className="relative group overflow-hidden rounded-md">
                    <img
                      src={shownUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-28 object-cover pointer-events-none select-none"
                      onError={() => { 
                        bumpIfAllowed(key, stableUrl);
                        itemError?.();          // ← ask parent to re-sign & update
                      }}
                    />

            {/* progress pill (optional visual) */}
            {uploading && (
              <div className="absolute left-1.5 bottom-1.5 z-20 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5">
                {typeof progress === "number" ? `${Math.max(2, progress)}%` : "…"}
              </div>
            )}

            <button
              type="button"
              data-testid="thumb-delete"
              aria-label="Delete photo"
              onClick={() => (itemDelete ? itemDelete() : onDelete?.(key))}
              disabled={!(itemDelete || onDelete)}
              className="absolute top-1.5 right-1.5 z-20 h-11 w-11 rounded-full bg-black/70 text-white flex items-center justify-center shadow ring-1 ring-white/20 pointer-events-auto disabled:opacity-60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
