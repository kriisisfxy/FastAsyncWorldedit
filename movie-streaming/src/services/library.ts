import { db } from "@/lib/db";
import { toMovieCard, toSeriesCard, type CardItem } from "./catalog";

const genreInclude = { genres: { select: { genre: { select: { name: true } } } } } as const;
const movieInclude = { ...genreInclude, _count: { select: { sources: true } } } as const;

export type ContinueItem = {
  key: string;
  href: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  progress: number;
  positionSec: number;
};

export async function continueWatching(userId: string, take = 18): Promise<ContinueItem[]> {
  const rows = await db.watchHistory.findMany({
    where: { userId, completed: false, positionSec: { gt: 15 } },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      movie: { select: { slug: true, title: true, backdropUrl: true, posterUrl: true, published: true } },
      episode: { select: { id: true, number: true, title: true, stillUrl: true, season: { select: { number: true, series: { select: { title: true, backdropUrl: true, published: true } } } } } },
    },
  });
  return rows.flatMap((r): ContinueItem[] => {
    const progress = r.durationSec ? Math.min(1, r.positionSec / r.durationSec) : 0;
    if (r.movie?.published) {
      return [{ key: r.id, href: `/watch/movie/${r.movie.slug}`, title: r.movie.title, subtitle: null, image: r.movie.backdropUrl ?? r.movie.posterUrl, progress, positionSec: r.positionSec }];
    }
    if (r.episode?.season.series.published) {
      const e = r.episode;
      return [{ key: r.id, href: `/watch/episode/${e.id}`, title: e.season.series.title, subtitle: `S${e.season.number} · E${e.number} ${e.title}`, image: e.stillUrl ?? e.season.series.backdropUrl, progress, positionSec: r.positionSec }];
    }
    return [];
  });
}

export async function recentlyWatched(userId: string, take = 30) {
  return db.watchHistory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      movie: { select: { slug: true, title: true, posterUrl: true, year: true } },
      episode: { select: { id: true, number: true, title: true, season: { select: { number: true, series: { select: { slug: true, title: true, posterUrl: true } } } } } },
    },
  });
}

export async function getProgress(userId: string, target: { movieId?: string; episodeId?: string }) {
  const row = await db.watchHistory.findFirst({ where: { userId, ...target }, select: { positionSec: true, durationSec: true, completed: true } });
  if (!row || row.completed) return 0;
  return row.positionSec;
}

export async function saveProgress(userId: string, input: { movieId?: string; episodeId?: string; positionSec: number; durationSec: number }) {
  const completed = input.durationSec > 0 && input.positionSec / input.durationSec > 0.92;
  const data = { positionSec: input.positionSec, durationSec: input.durationSec, completed };
  if (input.movieId) {
    const exists = await db.movie.count({ where: { id: input.movieId, published: true } });
    if (!exists) return null;
    return db.watchHistory.upsert({
      where: { userId_movieId: { userId, movieId: input.movieId } },
      update: data,
      create: { userId, movieId: input.movieId, ...data },
    });
  }
  const exists = await db.episode.count({ where: { id: input.episodeId } });
  if (!exists) return null;
  return db.watchHistory.upsert({
    where: { userId_episodeId: { userId, episodeId: input.episodeId! } },
    update: data,
    create: { userId, episodeId: input.episodeId, ...data },
  });
}

export async function watchlist(userId: string): Promise<CardItem[]> {
  const rows = await db.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { movie: { include: movieInclude }, series: { include: genreInclude } },
  });
  return rows.flatMap((r) =>
    r.movie?.published ? [toMovieCard(r.movie)] : r.series?.published ? [toSeriesCard(r.series)] : [],
  );
}

export async function isInWatchlist(userId: string | undefined, target: { movieId?: string; seriesId?: string }) {
  if (!userId) return false;
  return (await db.watchlistItem.count({ where: { userId, ...target } })) > 0;
}

export async function toggleWatchlist(userId: string, target: { movieId?: string; seriesId?: string }) {
  const existing = await db.watchlistItem.findFirst({ where: { userId, ...target } });
  if (existing) {
    await db.watchlistItem.delete({ where: { id: existing.id } });
    return false;
  }
  if (target.movieId && !(await db.movie.count({ where: { id: target.movieId, published: true } }))) return null;
  if (target.seriesId && !(await db.series.count({ where: { id: target.seriesId, published: true } }))) return null;
  await db.watchlistItem.create({ data: { userId, ...target } });
  return true;
}

export async function userRating(userId: string | undefined, movieId: string) {
  if (!userId) return null;
  return (await db.rating.findUnique({ where: { userId_movieId: { userId, movieId } }, select: { value: true } }))?.value ?? null;
}

export async function communityRating(movieId: string) {
  const agg = await db.rating.aggregate({ where: { movieId }, _avg: { value: true }, _count: true });
  return { avg: agg._avg.value, count: agg._count };
}
