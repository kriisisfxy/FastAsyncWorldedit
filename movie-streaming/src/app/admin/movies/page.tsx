import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DeleteButton, FlagToggle } from "@/components/admin/RowActions";
import { Pagination } from "@/components/ui/Pagination";
import { db } from "@/lib/db";
import { pageParam, str } from "@/lib/utils";
import { AdminHeader } from "../AdminHeader";

const PER = 20;

export default async function AdminMovies({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = str(sp.q)?.slice(0, 80);
  const page = pageParam(sp.page);
  const where: Prisma.MovieWhereInput = q ? { title: { contains: q, mode: "insensitive" } } : {};
  const [total, movies] = await Promise.all([
    db.movie.count({ where }),
    db.movie.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER,
      select: { id: true, title: true, slug: true, year: true, featured: true, published: true, views: true, posterUrl: true, _count: { select: { sources: true } }, genres: { select: { genre: { select: { name: true } } } } },
    }),
  ]);
  return (
    <>
      <AdminHeader title="Movies" sub={`${total} in the catalogue`}>
        <Link href="/admin/movies/new" className="btn-violet">Add movie</Link>
      </AdminHeader>
      <form className="mb-5"><input name="q" defaultValue={q} placeholder="Search by title…" className="field max-w-sm" aria-label="Search movies" /></form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs text-mute">
            <tr><th className="px-5 py-3 font-medium">Title</th><th className="px-3 py-3 font-medium">Genres</th><th className="px-3 py-3 font-medium">Sources</th><th className="px-3 py-3 text-right font-medium">Plays</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {movies.map((m) => (
              <tr key={m.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <Link href={`/admin/movies/${m.id}`} className="flex items-center gap-3 font-semibold hover:text-violet-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {m.posterUrl ? <img src={m.posterUrl} alt="" className="h-12 w-8 rounded object-cover" loading="lazy" /> : <span className="h-12 w-8 rounded bg-ink-3" />}
                    <span>{m.title} <span className="font-normal text-mute">({m.year})</span></span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-mute">{m.genres.map((g) => g.genre.name).join(", ")}</td>
                <td className="px-3 py-3">{m._count.sources ? <span className="text-soft">{m._count.sources}</span> : <span className="text-amber-300/80">none</span>}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mute">{m.views.toLocaleString("en")}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1.5">
                    <FlagToggle url={`/api/admin/movies/${m.id}`} field="published" value={m.published} label="Toggle published" />
                    <FlagToggle url={`/api/admin/movies/${m.id}`} field="featured" value={m.featured} label="Toggle featured" />
                  </div>
                </td>
                <td className="px-5 py-3 text-right"><DeleteButton small url={`/api/admin/movies/${m.id}`} label={`“${m.title}”`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!movies.length && <p className="px-5 py-10 text-center text-mute">No movies found.</p>}
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} params={{ q }} basePath="/admin/movies" />
    </>
  );
}
