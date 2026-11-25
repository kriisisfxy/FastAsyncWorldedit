"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";

/** Horizontal, scroll-snapping row with arrow buttons on wider screens. */
export function MediaRow({ title, href, children, count }: { title: string; href?: string; children: React.ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!count) return null;
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="group/row relative py-5" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4 px-[max(4vw,16px)]">
        <h2 className="font-display text-xl font-bold tracking-[-0.02em] sm:text-[23px]">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-mute transition hover:text-violet-2">
            See all
          </Link>
        )}
      </div>
      <div className="relative">
        <div
          ref={ref}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-[max(4vw,16px)] px-[max(4vw,16px)] pb-4 pt-2 sm:gap-4"
        >
          {children}
        </div>
        <button onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="absolute left-2 top-[38%] hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-ink/80 opacity-0 ring-1 ring-white/15 backdrop-blur transition hover:bg-violet group-hover/row:opacity-100 md:grid">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="absolute right-2 top-[38%] hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-ink/80 opacity-0 ring-1 ring-white/15 backdrop-blur transition hover:bg-violet group-hover/row:opacity-100 md:grid">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </section>
  );
}

export function RowItem({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "w-[78vw] shrink-0 snap-start sm:w-[340px]" : "w-[38vw] shrink-0 snap-start sm:w-[180px] lg:w-[196px]"}>{children}</div>;
}
