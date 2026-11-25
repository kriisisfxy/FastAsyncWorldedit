import Link from "next/link";
import { ChevronLeft, ChevronRight } from "./Icons";

export function Pagination({ page, pages, params, basePath }: { page: number; pages: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && q.set(k, v));
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)} className="btn-quiet size-11 p-0" aria-label="Previous page"><ChevronLeft className="size-5" /></Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-mute">…</span>}
          <Link href={href(n)} aria-current={n === page ? "page" : undefined} className={n === page ? "btn h-11 min-w-11 bg-violet px-3 text-white" : "btn-quiet h-11 min-w-11"}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className="btn-quiet size-11 p-0" aria-label="Next page"><ChevronRight className="size-5" /></Link>}
    </nav>
  );
}
