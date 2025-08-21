// src/components/ThumbnailGrid.tsx
import { X } from "lucide-react";
import { useRef } from "react";
import { useSignedUrl } from "@/lib/useSignedUrl";
import clsx from "clsx"; // if you don't use clsx, remove and inline class strings

// src/components/ThumbnailGrid.tsx
export type Thumb = {
  key: string;
  url?: string;
  uploading?: boolean;   // ✅ include these
  progress?: number;     // ✅ include these
  onDelete?: () => void;
};

function ThumbImage({ url, storageKey }: { url?: string; storageKey: string }) {
  // If url is provided (public), use it; else fetch a signed URL by key
  const useSigning = !url && !storageKey.startsWith("tmp:");
  const { url: signed, refresh } = useSignedUrl(useSigning ? storageKey : undefined as any);
  const src = url ?? signed;

  const triedRefresh = useRef(false);

  if (!src) {
    // simple skeleton while signing
    return <div className="aspect-square w-full bg-muted animate-pulse" />;
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="aspect-square w-full object-cover select-none"
      onError={async (e) => {
         // likely expired signed URL; refresh once (skip tmp keys / blobs)
         if (triedRefresh.current || !useSigning) return;
        triedRefresh.current = true;
        try {
          const fresh = await refresh();
          if (fresh) {
            (e.currentTarget as HTMLImageElement).src = fresh;
          }
        } catch {
          // leave broken state; user can delete or we’ll re-sign on next open
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
          {/* IMPORTANT: use storageKey, not "key" prop, for the child */}
          <ThumbImage url={it.url} storageKey={it.key} />

          {/* delete button */}
          {it.onDelete && (
            <button
              onClick={it.onDelete}
              className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition
                         bg-black/60 text-white rounded-full p-1.5 focus:opacity-100 focus:outline-none"
              aria-label="Delete"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* progress overlay */}
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
