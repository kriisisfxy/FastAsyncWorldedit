import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { toPlayerSources } from "@/lib/playback";
import { currentUser } from "@/lib/session";
import { countView, getMovie } from "@/services/catalog";
import { getProgress } from "@/services/library";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getMovie((await params).slug);
  return { title: m ? `Watch ${m.title}` : "Not found", robots: { index: false } };
}

export default async function WatchMoviePage({ params }: Props) {
  const movie = await getMovie((await params).slug);
  if (!movie) notFound();
  const user = await currentUser();
  const startAt = user ? await getProgress(user.id, { movieId: movie.id }) : 0;
  await countView("movie", movie.id);
  return (
    <Player
      title={movie.title}
      subtitle={`${movie.year}${movie.runtime ? ` · ${movie.runtime} min` : ""}`}
      backHref={`/movie/${movie.slug}`}
      sources={toPlayerSources(movie.sources)}
      target={{ movieId: movie.id }}
      startAt={startAt}
      signedIn={!!user}
      poster={movie.backdropUrl}
    />
  );
}
