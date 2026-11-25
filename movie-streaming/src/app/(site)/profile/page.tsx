import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ContinueCard } from "@/components/media/ContinueCard";
import { Artwork } from "@/components/media/Artwork";
import { AvatarUpload, ProfileForm } from "@/components/account/ProfileForms";
import { SessionProvider } from "@/components/account/SessionProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { continueWatching, recentlyWatched } from "@/services/library";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const me = await currentUser();
  if (!me) redirect("/login?callbackUrl=/profile");
  const [user, cont, history, counts] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: me.id }, select: { name: true, email: true, avatarUrl: true, createdAt: true, role: true } }),
    continueWatching(me.id, 12),
    recentlyWatched(me.id, 40),
    db.user.findUniqueOrThrow({ where: { id: me.id }, select: { _count: { select: { history: true, watchlist: true, ratings: true } } } }),
  ]);

  return (
    <SessionProvider>
      <div className="px-[max(4vw,16px)] pt-28">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Member since {user.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
            <h1 className="font-display text-[clamp(34px,5vw,52px)] font-extrabold leading-none tracking-[-0.025em]">{user.name}</h1>
            <p className="mt-2 text-mute">{user.email}</p>
          </div>
          <dl className="flex gap-8">
            {[["Watched", counts._count.history], ["In my list", counts._count.watchlist], ["Rated", counts._count.ratings]].map(([k, v]) => (
              <div key={k as string}><dt className="text-sm text-mute">{k}</dt><dd className="font-display text-3xl font-bold">{v}</dd></div>
            ))}
          </dl>
        </header>

        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold">Continue watching</h2>
          {cont.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cont.map((c) => <ContinueCard key={c.key} item={c} />)}</div>
          ) : (
            <p className="text-mute">Nothing in progress. <Link href="/" className="text-violet-2 hover:underline">Find something to watch</Link>.</p>
          )}
        </section>

        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl font-bold">Watch history</h2>
          {history.length ? (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {history.map((h) => {
                const movie = h.movie;
                const ep = h.episode;
                const href = movie ? `/movie/${movie.slug}` : ep ? `/series/${ep.season.series.slug}` : "#";
                const poster = movie?.posterUrl ?? ep?.season.series.posterUrl ?? null;
                const pct = h.completed ? 100 : h.durationSec ? Math.round((h.positionSec / h.durationSec) * 100) : 0;
                return (
                  <li key={h.id}>
                    <Link href={href} className="flex items-center gap-4 bg-ink-2/40 px-4 py-3 transition hover:bg-white/5">
                      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-ink-3"><Artwork src={poster} alt="" sizes="44px" fallbackTitle="" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{movie?.title ?? ep?.season.series.title}</p>
                        <p className="truncate text-sm text-mute">{ep ? `S${ep.season.number} · E${ep.number} ${ep.title}` : movie?.year}</p>
                      </div>
                      <div className="hidden w-32 sm:block">
                        <div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-violet-2" style={{ width: `${pct}%` }} /></div>
                        <p className="mt-1 text-right text-xs text-mute">{h.completed ? "Finished" : `${pct}%`}</p>
                      </div>
                      <time className="w-24 shrink-0 text-right text-sm text-mute" dateTime={h.updatedAt.toISOString()}>
                        {h.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No history yet">Films you watch will appear here.</EmptyState>
          )}
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <h2 className="font-display text-xl font-bold">Account</h2>
            <p className="mt-1 text-sm text-mute">Update your photo, name or password.</p>
          </div>
          <div className="card space-y-8 p-6 sm:p-8">
            <AvatarUpload name={user.name} image={user.avatarUrl} />
            <ProfileForm name={user.name} />
          </div>
        </section>
      </div>
    </SessionProvider>
  );
}
