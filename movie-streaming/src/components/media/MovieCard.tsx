import Link from "next/link";
import { Artwork } from "./Artwork";
import { StarIcon } from "@/components/ui/Icons";
import { cn, formatRuntime } from "@/lib/utils";
import type { CardItem } from "@/services/catalog";

export function MovieCard({ item, className, priority }: { item: CardItem; className?: string; priority?: boolean }) {
  const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const runtime = formatRuntime(item.runtime);
  return (
    <Link
      href={href}
      className={cn("group/card relative block rounded-xl outline-none", className)}
      aria-label={`${item.title} (${item.year})`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-3 ring-1 ring-white/5 transition duration-500 ease-out-expo group-hover/card:-translate-y-1.5 group-hover/card:ring-violet/60 group-hover/card:shadow-[0_24px_50px_-20px_rgb(139_92_255/0.55)] group-focus-visible/card:ring-2 group-focus-visible/card:ring-violet-2">
        <Artwork src={item.posterUrl} alt="" fallbackTitle={item.title} sizes="(max-width: 640px) 42vw, (max-width: 1024px) 24vw, 200px" priority={priority} className="transition duration-700 ease-out-expo group-hover/card:scale-[1.06]" />
        {item.type === "series" && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-violet px-2 py-0.5 text-[11px] font-bold">Series</span>
        )}
        {/* Quick details revealed on hover / focus */}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-ink via-ink/90 to-transparent p-3 pt-10 opacity-0 transition duration-300 ease-out-expo group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
          <p className="line-clamp-3 text-[12.5px] leading-snug text-soft">{item.description}</p>
          <p className="mt-2 text-[11.5px] font-medium text-violet-2">{item.genres.slice(0, 2).join(" · ")}{runtime && ` · ${runtime}`}</p>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[14.5px] font-semibold text-white/95">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[13px] text-mute">
          <span>{item.year}</span>
          {item.rating !== null && (
            <span className="inline-flex items-center gap-1 text-gold"><StarIcon className="size-3.5" />{item.rating.toFixed(1)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
