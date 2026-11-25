import { MovieCard } from "@/components/media/MovieCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CardItem } from "@/services/catalog";

export function BrowseGrid({ items, empty }: { items: CardItem[]; empty?: React.ReactNode }) {
  if (!items.length) return <div className="py-10">{empty ?? <EmptyState title="Nothing here yet">Try removing a filter.</EmptyState>}</div>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((m, i) => <MovieCard key={m.type + m.id} item={m} priority={i < 6} />)}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-[clamp(34px,5vw,52px)] font-extrabold leading-[1.02] tracking-[-0.025em] text-balance">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-[16px] text-mute">{children}</div>}
    </header>
  );
}
