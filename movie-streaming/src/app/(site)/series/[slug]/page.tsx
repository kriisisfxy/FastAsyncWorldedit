import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Artwork } from "@/components/media/Artwork";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { PlayIcon, StarIcon } from "@/components/ui/Icons";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { formatRuntime } from "@/lib/utils";
import { getSeries } from "@/services/catalog";
import { isInWatchlist } from "@/services/library";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getSeries((await params).slug);
  return s ? { title: s.title, description: s.description.slice(0, 160) } : { title: "Not found" };
}

export default async function SeriesDetailPage({ params }: Props) {
  const series = await getSeries((await params).slug);
  if (!series) notFound();
  const user = await currentUser();
  const episodes = series.seasons.flatMap((s) => s.episodes);
  const [inList, progress] = await Promise.all([
    isInWatchlist(user?.id, { seriesId: series.id }),
    user
      ? db.watchHistory.findMany({ where: { userId: user.id, episodeId: { in: episodes.map((e) => e.id) } }, select: { episodeId: true, positionSec: true, durationSec: true, completed: true, updatedAt: true } })
      : Promise.resolve([]),
  ]);
  const byEp = new Map(progress.map((p) => [p.episodeId!, p]));
  // Resume the most recent unfinished episode, otherwise the first one not yet completed.
  const latest = [...progress].sort((a, b) => +b.updatedAt - +a.updatedAt)[0];
  const playableEps = episodes.filter((e) => e._count.sources > 0);
  const resume =
    (latest && !latest.completed && playableEps.find((e) => e.id === latest.episodeId)) ||
    playableEps.find((e) => !byEp.get(e.id)?.completed) ||
    playableEps[0];
  const rating = series.imdbRating === null ? null : Number(series.imdbRating);

  return (
    <article>
      <section className="grain relative isolate min-h-[64svh] overflow-hidden pb-12 pt-32">
        <div className="absolute inset-0 -z-10"><Artwork src={series.backdropUrl} alt="" sizes="100vw" priority className="opacity-70" /></div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#090909_8%,rgb(9_9_9/0.6)_50%,transparent),linear-gradient(0deg,#090909,transparent_50%)]" />
        <div className="max-w-3xl px-[max(4vw,16px)]">
          <p className="eyebrow">Series · {series.seasons.length} season{series.seasons.length === 1 ? "" : "s"}</p>
          <h1 className="mt-3 font-display text-[clamp(38px,6vw,76px)] font-extrabold leading-[0.95] tracking-[-0.03em]">{series.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-soft">
            {rating !== null && <span className="inline-flex items-center gap-1.5 font-semibold text-white"><span className="rounded bg-gold px-1.5 py-px text-[11px] font-extrabold text-ink">IMDb</span>{rating.toFixed(1)}<StarIcon className="size-3.5 text-gold" /></span>}
            <span>{series.startYear}{series.endYear ? `–${series.endYear}` : "–"}</span>
            <span>{series.genres.map((g) => g.genre.name).join(" · ")}</span>
          </div>
          <p className="mt-6 text-[17px] leading-relaxed text-soft">{series.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {resume ? (
              <Link href={`/watch/episode/${resume.id}`} className="btn-primary h-12 px-7 text-base">
                <PlayIcon className="size-5" /> {byEp.has(resume.id) ? "Continue" : "Play"} E{resume.number}
              </Link>
            ) : (
              <span className="btn h-12 bg-white/10 px-7 text-mute">Coming soon</span>
            )}
            <WatchlistButton seriesId={series.id} initial={inList} signedIn={!!user} />
          </div>
        </div>
      </section>

      <section id="episodes" className="px-[max(4vw,16px)] py-6">
        {series.seasons.map((season) => (
          <div key={season.id} className="mb-12">
            <h2 className="font-display text-2xl font-bold">Season {season.number}{season.title && <span className="ml-3 text-base font-medium text-mute">{season.title}</span>}</h2>
            <ol className="mt-5 grid gap-3">
              {season.episodes.map((ep) => {
                const p = byEp.get(ep.id);
                const pct = p?.completed ? 100 : p?.durationSec ? (p.positionSec / p.durationSec) * 100 : 0;
                const playable = ep._count.sources > 0;
                const inner = (
                  <>
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-ink-3 sm:w-56">
                      <Artwork src={ep.stillUrl ?? series.backdropUrl} alt="" sizes="224px" fallbackTitle="" />
                      {playable && <span className="absolute inset-0 grid place-items-center bg-ink/30 opacity-0 transition group-hover:opacity-100"><PlayIcon className="size-8" /></span>}
                      {pct > 0 && <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><span className="block h-full bg-violet-2" style={{ width: `${pct}%` }} /></span>}
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="font-semibold"><span className="mr-2 text-mute">{ep.number}.</span>{ep.title}</p>
                      <p className="mt-0.5 text-sm text-mute">{formatRuntime(ep.runtime)}{!playable && " · Not yet available"}</p>
                      {ep.description && <p className="mt-2 line-clamp-2 text-[15px] text-soft">{ep.description}</p>}
                    </div>
                  </>
                );
                return (
                  <li key={ep.id}>
                    {playable ? (
                      <Link href={`/watch/episode/${ep.id}`} className="group flex gap-4 rounded-2xl p-2 transition hover:bg-white/5">{inner}</Link>
                    ) : (
                      <div className="flex gap-4 rounded-2xl p-2 opacity-60">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>
    </article>
  );
}
