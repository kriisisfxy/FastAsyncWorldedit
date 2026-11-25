import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { toPlayerSources } from "@/lib/playback";
import { currentUser } from "@/lib/session";
import { countView, getEpisode } from "@/services/catalog";
import { getProgress } from "@/services/library";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getEpisode((await params).id);
  return { title: r ? `${r.ep.season.series.title} · ${r.ep.title}` : "Not found", robots: { index: false } };
}

export default async function WatchEpisodePage({ params }: Props) {
  const result = await getEpisode((await params).id);
  if (!result) notFound();
  const { ep, next } = result;
  const series = ep.season.series;
  const user = await currentUser();
  const startAt = user ? await getProgress(user.id, { episodeId: ep.id }) : 0;
  await countView("series", series.id);
  return (
    <Player
      title={series.title}
      subtitle={`S${ep.season.number} · E${ep.number} — ${ep.title}`}
      backHref={`/series/${series.slug}#episodes`}
      sources={toPlayerSources(ep.sources)}
      target={{ episodeId: ep.id }}
      startAt={startAt}
      signedIn={!!user}
      poster={ep.stillUrl ?? series.backdropUrl}
      next={next ? { href: `/watch/episode/${next.id}`, title: `E${next.number} · ${next.title}`, label: "Next episode" } : null}
    />
  );
}
