import Link from "next/link";
import { db } from "@/lib/db";
import { providers } from "@/lib/providers";
import { AdminHeader } from "../AdminHeader";

function check(provider: string, ref: string) {
  try {
    providers[provider as keyof typeof providers].normalize(ref);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export default async function AdminSources() {
  const [sources, missingMovies] = await Promise.all([
    db.videoSource.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        movie: { select: { id: true, title: true } },
        episode: { select: { number: true, title: true, season: { select: { number: true, series: { select: { id: true, title: true } } } } } },
        _count: { select: { subtitles: true } },
      },
    }),
    db.movie.findMany({ where: { sources: { none: {} } }, select: { id: true, title: true, year: true }, orderBy: { title: "asc" } }),
  ]);
  const counts = Object.values(providers).map((p) => ({ ...p, count: sources.filter((s) => s.provider === p.id).length }));

  return (
    <>
      <AdminHeader title="Video sources" sub="Every playable source, grouped by provider. Edit a source from its movie or episode." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {counts.map((p) => (
          <div key={p.id} className="card p-5">
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1 font-display text-3xl font-bold">{p.count}</p>
            <p className="mt-2 text-xs leading-relaxed text-mute">{p.adminHint}</p>
          </div>
        ))}
      </div>

      {missingMovies.length > 0 && (
        <section className="card mb-6 p-5">
          <h2 className="font-semibold">Movies without a source <span className="text-mute">({missingMovies.length})</span></h2>
          <p className="mt-1 text-sm text-mute">These show “Coming soon” to viewers.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingMovies.map((m) => <Link key={m.id} href={`/admin/movies/${m.id}`} className="chip h-8 text-xs">{m.title} ({m.year})</Link>)}
          </div>
        </section>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-mute">
            <tr><th className="px-5 py-3 font-medium">Title</th><th className="px-3 py-3 font-medium">Provider</th><th className="px-3 py-3 font-medium">Label</th><th className="px-3 py-3 font-medium">Reference</th><th className="px-5 py-3 font-medium">Check</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sources.map((s) => {
              const problem = check(s.provider, s.ref);
              const href = s.movie ? `/admin/movies/${s.movie.id}` : `/admin/series/${s.episode?.season.series.id}`;
              const title = s.movie ? s.movie.title : `${s.episode?.season.series.title} · S${s.episode?.season.number}E${s.episode?.number}`;
              return (
                <tr key={s.id}>
                  <td className="px-5 py-3"><Link href={href} className="font-medium hover:text-violet-2">{title}</Link></td>
                  <td className="px-3 py-3">{s.provider === "VIDEA" ? "Videa" : "Direct"}</td>
                  <td className="px-3 py-3 text-mute">{s.label}{s.isPrimary && " · primary"}{s._count.subtitles ? ` · ${s._count.subtitles} subs` : ""}</td>
                  <td className="max-w-[320px] truncate px-3 py-3 font-mono text-xs text-mute" title={s.ref}>{s.ref}</td>
                  <td className="px-5 py-3">{problem ? <span className="text-red-300">{problem}</span> : <span className="text-violet-2">Valid</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
