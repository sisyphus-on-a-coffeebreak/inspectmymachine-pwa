// src/components/ThumbnailGrid.tsx
import { X } from "lucide-react";
import { useRef } from "react";
import { useSignedUrl } from "@/lib/useSignedUrl";
import clsx from "clsx";

export type Thumb = {
  key: string;
  url?: string;
  uploading?: boolean;
  progress?: number;
  onDelete?: () => void;
  onReplace?: () => void;
};

function ThumbImage({ url, storageKey }: { url?: string; storageKey: string }) {
  const useSigning = !url && !storageKey.startsWith("tmp:");
  const { url: signed, refresh } = useSignedUrl(useSigning ? storageKey : undefined as any);
  const src = url ?? signed;

  const triedRefresh = useRef(false);

  if (!src) {
    return <div className="aspect-square w-full bg-muted animate-pulse" />;
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="aspect-square w-full object-cover select-none"
      onError={async (e) => {
        if (triedRefresh.current || !useSigning) return;
        triedRefresh.current = true;
        try {
          const fresh = await refresh();
          if (fresh) (e.currentTarget as HTMLImageElement).src = fresh;
        } catch {
          /* silently ignore */
        }
      }}
    />
  );
}

export default function ThumbnailGrid({ items }: { items: Thumb[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.key}
          className={clsx(
            "relative group rounded-xl overflow-hidden",
            it.uploading && "cursor-wait"
          )}
          aria-busy={!!it.uploading}
          aria-label="Photo thumbnail"
        >
          <ThumbImage url={it.url} storageKey={it.key} />

          {it.onDelete && (
  <button
    type="button"
    onClick={it.onDelete}
    aria-label="Delete"
    className="absolute top-2 right-2 z-20 opacity-100 transition bg-black/70 text-white rounded-full p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
  >
    <X className="h-4 w-4" />
  </button>
)}


          {it.uploading && (
            <div className="absolute inset-0 z-10 bg-black/30 flex items-end pointer-events-none">
              <div className="w-full h-1.5 bg-white/30">
                <div
                  className="h-1.5 bg-white"
                  style={{ width: `${Math.max(2, it.progress ?? 0)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
