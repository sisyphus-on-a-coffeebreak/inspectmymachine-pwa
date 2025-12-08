import { useCallback, useState } from "react";
import { X } from "lucide-react";

type Item = {
  key: string;
  url: string;
  uploading?: boolean;
  progress?: number;
  onDelete?: () => void; // per-item (no args)
  onError?: () => void;  // per-item error hook
};

type Props = {
  items: Item[];
  onDelete?: (key: string) => void; // optional fallback
};

function isBustable(u: string) { return /^https?:\/\//i.test(u); }
function withCacheBuster(u: string, n = 0) {
  if (!isBustable(u) || n <= 0) return u;
  const [base, hash] = u.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}cb=${n}${hash ? `#${hash}` : ""}`;
}

const BTN_SIZE = 32; // 32px minimum touch target for accessibility

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

        const callDelete = () => {
          if (itemDelete) itemDelete();
          else onDelete?.(key);
        };

        return (
          <div key={key} className="relative overflow-hidden rounded-md">
            <img
              src={shownUrl}
              alt={`Thumbnail ${key}`}
              loading="lazy"
              className="w-full h-28 object-cover select-none"
              style={{ pointerEvents: "none" }}
              onError={() => { try { itemOnError?.(); } finally { bumpIfAllowed(key, url); } }}
            />

            {uploading && (
              <div
                className="rounded text-[10px] px-2 py-0.5"
                style={{
                  position: "absolute",
                  left: 8,
                  bottom: 8,
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  zIndex: 9998
                }}
              >
                {typeof progress === "number" ? `${Math.max(2, progress)}%` : "…"}
              </div>
            )}

            {/* Cross-in-a-circle delete button */}
            <button
              type="button"
              aria-label="Delete photo"
              data-testid="thumb-delete"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); callDelete(); }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} // avoid ghost-clicks
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: BTN_SIZE,
                height: BTN_SIZE,
                borderRadius: 9999,
                background: "rgba(220,38,38,0.95)", // red-600-ish
                color: "#fff",
                zIndex: 100000, // sit above everything
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 14px rgba(0,0,0,.45)",
                touchAction: "manipulation",
                cursor: "pointer"
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
