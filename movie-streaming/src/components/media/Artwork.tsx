import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Poster/backdrop image. Lazy-loaded and optimised by next/image; local SVG demo art skips the optimiser.
 * Shows a tinted placeholder with the title when no image is set.
 */
export function Artwork({
  src, alt, sizes, priority, className, fallbackTitle,
}: { src: string | null | undefined; alt: string; sizes: string; priority?: boolean; className?: string; fallbackTitle?: string }) {
  if (!src) {
    return (
      <div className={cn("absolute inset-0 grid place-items-end bg-gradient-to-br from-violet-deep/50 via-ink-3 to-ink p-4", className)}>
        <span className="font-display text-lg font-bold leading-tight text-white/80">{fallbackTitle ?? alt}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={cn("object-cover", className)}
    />
  );
}
