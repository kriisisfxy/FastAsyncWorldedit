import Link from "next/link";
import { siteStats } from "@/services/admin";
import { AdminHeader } from "./AdminHeader";

export default async function AdminOverview() {
  const s = await siteStats();
  const max = Math.max(1, ...s.daily.map((d) => d.plays));
  const tiles = [
    { label: "Movies", value: s.movies, href: "/admin/movies" },
    { label: "Series", value: s.series, sub: `${s.episodes} episodes`, href: "/admin/series" },
    { label: "Users", value: s.users, sub: `+${s.newUsers} this week`, href: "/admin/users" },
    { label: "Active viewers", value: s.activeViewers, sub: "last 7 days" },
    { label: "Total plays", value: s.totalViews.toLocaleString("en") },
    { label: "Video sources", value: s.sources, href: "/admin/sources" },
  ];
  return (
    <>
      <AdminHeader title="Overview" sub="How the catalogue and audience are doing.">
        <Link href="/admin/movies/new" className="btn-violet">Add movie</Link>
        <Link href="/admin/series/new" className="btn-ghost">Add series</Link>
      </AdminHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-sm text-mute">{t.label}</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums">{t.value}</p>
              {t.sub && <p className="mt-0.5 text-xs text-mute">{t.sub}</p>}
            </>
          );
          return t.href ? <Link key={t.label} href={t.href} className="card p-5 transition hover:border-violet/50">{body}</Link> : <div key={t.label} className="card p-5">{body}</div>;
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold">Viewing activity</h2>
          <p className="text-sm text-mute">Titles started or resumed per day, last 14 days</p>
          <div className="mt-6 flex h-48 items-end gap-1.5" role="img" aria-label="Daily plays chart">
            {s.daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t-md bg-gradient-to-t from-violet-deep to-violet-2 transition group-hover:from-violet group-hover:to-white" style={{ height: `${Math.max(2, (d.plays / max) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-xs font-bold text-ink opacity-0 group-hover:opacity-100">{d.plays}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-mute">
            <span>{s.daily[0]?.day.slice(5)}</span>
            <span>{s.daily.at(-1)?.day.slice(5)}</span>
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold">Most watched</h2>
          <ol className="mt-4 space-y-3">
            {s.topMovies.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-mute">{i + 1}</span>
                <Link href={`/admin/movies/${m.id}`} className="flex-1 truncate font-medium hover:text-violet-2">{m.title}</Link>
                <span className="text-sm tabular-nums text-mute">{m.views.toLocaleString("en")}</span>
              </li>
            ))}
          </ol>
          <h2 className="mt-8 font-display text-lg font-bold">Newest members</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {s.recentUsers.map((u) => (
              <li key={u.id} className="flex justify-between gap-3">
                <span className="truncate">{u.name} <span className="text-mute">· {u.email}</span></span>
                <span className="shrink-0 text-mute">{u.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
