import { useCallback, useState } from "react";
import { X } from "lucide-react";

type Item = {
  key: string;
  url: string;
  uploading?: boolean;
  progress?: number;
  onDelete?: () => void;
};

type Props = {
  items: Item[];
  onDelete?: (key: string) => void;
};

// only bust caches for real http(s) URLs (NOT blob: / data:)
function isBustable(u: string) {
  return /^https?:\/\//i.test(u);
}

// presigned URL heuristics (S3, R2, GCS style)
function isSignedUrl(u: string) {
  if (!isBustable(u)) return false;
  return /[?&](X-Amz-Algorithm|X-Amz-Credential|X-Amz-Signature|X-Goog-Signature|X-Goog-Algorithm)=/i.test(u);
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
    // Do not bump on signed URLs or non-bustable schemes
    if (!isBustable(url) || isSignedUrl(url)) return;
    setRetryMap((m) => {
      const next = (m[key] ?? 0) + 1;
      return next > 3 ? m : { ...m, [key]: next };
    });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ key, url, uploading, progress, onDelete: itemDelete }) => {
        const tries = retryMap[key] ?? 0;
        const shownUrl = isSignedUrl(url) ? url : withCacheBuster(url, tries);

        return (
          <div key={key} className="relative group overflow-hidden rounded-md">
            <img
              src={shownUrl}
              alt=""
              loading="lazy"
              className="w-full h-28 object-cover pointer-events-none select-none"
              onError={() => bumpIfAllowed(key, url)}
              // if you ever draw these to a canvas, keep CORS clean:
              // crossOrigin={isSignedUrl(url) ? undefined : "anonymous"}
            />

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
