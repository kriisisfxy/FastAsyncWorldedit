import Link from "next/link";
import { Artwork } from "./Artwork";
import { PlayIcon } from "@/components/ui/Icons";
import type { ContinueItem } from "@/services/library";

export function ContinueCard({ item }: { item: ContinueItem }) {
  return (
    <Link href={item.href} className="group/c block" aria-label={`Continue ${item.title}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-3 ring-1 ring-white/5 transition group-hover/c:ring-violet/60">
        <Artwork src={item.image} alt="" sizes="(max-width: 640px) 78vw, 340px" className="transition duration-700 group-hover/c:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent" />
        <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 opacity-0 backdrop-blur transition group-hover/c:opacity-100">
          <PlayIcon className="size-5 translate-x-px" />
        </span>
        <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-violet-2" style={{ width: `${Math.max(4, item.progress * 100)}%` }} />
        </div>
      </div>
      <p className="mt-2.5 truncate text-[14.5px] font-semibold">{item.title}</p>
      {item.subtitle && <p className="truncate text-[13px] text-mute">{item.subtitle}</p>}
    </Link>
  );
}
