import { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/utils";

export type CardItem = {
  id: string;
  type: "movie" | "series";
  slug: string;
  title: string;
  year: number;
  rating: number | null;
  runtime: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  description: string;
  genres: string[];
  /** Whether at least one video source exists (movies) or the series has playable episodes. */
  playable: boolean;
};

const movieCardSelect = {
  id: true, slug: true, title: true, year: true, imdbRating: true, runtime: true,
  posterUrl: true, backdropUrl: true, description: true,
  genres: { select: { genre: { select: { name: true } } } },
  _count: { select: { sources: true } },
} satisfies Prisma.MovieSelect;

type MovieCardRow = Prisma.MovieGetPayload<{ select: typeof movieCardSelect }>;

export const toMovieCard = (m: MovieCardRow): CardItem => ({
  id: m.id, type: "movie", slug: m.slug, title: m.title, year: m.year,
  rating: m.imdbRating === null ? null : Number(m.imdbRating), runtime: m.runtime,
  posterUrl: m.posterUrl, backdropUrl: m.backdropUrl, description: m.description,
  genres: m.genres.map((g) => g.genre.name),
  playable: m._count.sources > 0,
});

const seriesCardSelect = {
  id: true, slug: true, title: true, startYear: true, imdbRating: true, posterUrl: true, backdropUrl: true, description: true,
  genres: { select: { genre: { select: { name: true } } } },
} satisfies Prisma.SeriesSelect;

type SeriesCardRow = Prisma.SeriesGetPayload<{ select: typeof seriesCardSelect }>;

export const toSeriesCard = (s: SeriesCardRow): CardItem => ({
  id: s.id, type: "series", slug: s.slug, title: s.title, year: s.startYear,
  rating: s.imdbRating === null ? null : Number(s.imdbRating), runtime: null,
  posterUrl: s.posterUrl, backdropUrl: s.backdropUrl, description: s.description,
  genres: s.genres.map((g) => g.genre.name),
  playable: true,
});

const published = { published: true } as const;

export async function moviesBy(orderBy: Prisma.MovieOrderByWithRelationInput[], take = 18, where: Prisma.MovieWhereInput = {}) {
  const rows = await db.movie.findMany({ where: { ...published, ...where }, orderBy, take, select: movieCardSelect });
  return rows.map(toMovieCard);
}

/** Most watched in the last 7 days, topped up with all-time popular titles. */
export async function trendingMovies(take = 18) {
  const since = new Date(Date.now() - 7 * 864e5);
  const grouped = await db.watchHistory.groupBy({
    by: ["movieId"],
    where: { updatedAt: { gte: since }, movieId: { not: null }, movie: published },
    _count: { movieId: true },
    orderBy: { _count: { movieId: "desc" } },
    take,
  });
  const ids = grouped.map((g) => g.movieId!) as string[];
  const hot = ids.length ? await moviesBy([], take, { id: { in: ids } }) : [];
  hot.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  if (hot.length >= take) return hot;
  const fill = await moviesBy([{ views: "desc" }], take - hot.length, { id: { notIn: ids } });
  return [...hot, ...fill];
}

export const moviesInGenre = (slug: string, take = 18) =>
  moviesBy([{ imdbRating: { sort: "desc", nulls: "last" } }, { year: "desc" }], take, { genres: { some: { genre: { slug } } } });

/** Recommendations: genres the user watched most, excluding what they have seen. Falls back to top rated. */
export async function recommendedMovies(userId?: string, take = 18) {
  if (userId) {
    const history = await db.watchHistory.findMany({
      where: { userId, movieId: { not: null } },
      select: { movieId: true, movie: { select: { genres: { select: { genreId: true } } } } },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
    const counts = new Map<string, number>();
    history.forEach((h) => h.movie?.genres.forEach((g) => counts.set(g.genreId, (counts.get(g.genreId) ?? 0) + 1)));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
    if (top.length) {
      const seen = history.map((h) => h.movieId!) as string[];
      const recs = await moviesBy([{ imdbRating: { sort: "desc", nulls: "last" } }], take, {
        genres: { some: { genreId: { in: top } } },
        id: { notIn: seen },
      });
      if (recs.length >= 6) return recs;
    }
  }
  return moviesBy([{ imdbRating: { sort: "desc", nulls: "last" } }, { views: "desc" }], take);
}

export async function featuredItems() {
  const [movies, series] = await Promise.all([
    db.movie.findMany({ where: { ...published, featured: true }, select: movieCardSelect, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.series.findMany({ where: { ...published, featured: true }, select: seriesCardSelect, orderBy: { updatedAt: "desc" }, take: 3 }),
  ]);
  const items = [...movies.map(toMovieCard), ...series.map(toSeriesCard)];
  if (items.length) return items;
  return moviesBy([{ views: "desc" }], 3, { backdropUrl: { not: null } });
}

export type BrowseParams = {
  q?: string;
  genre?: string;
  year?: number;
  decade?: number;
  sort?: "popular" | "rating" | "newest" | "year" | "title";
  page?: number;
  type?: "movie" | "series" | "all";
};

function movieWhere(p: BrowseParams): Prisma.MovieWhereInput {
  const and: Prisma.MovieWhereInput[] = [published];
  if (p.q) {
    and.push({
      OR: [
        { title: { contains: p.q, mode: "insensitive" } },
        { cast: { some: { actor: { name: { contains: p.q, mode: "insensitive" } } } } },
      ],
    });
  }
  if (p.genre) and.push({ genres: { some: { genre: { slug: p.genre } } } });
  if (p.year) and.push({ year: p.year });
  else if (p.decade) and.push({ year: { gte: p.decade, lt: p.decade + 10 } });
  return { AND: and };
}

function movieOrder(sort: BrowseParams["sort"]): Prisma.MovieOrderByWithRelationInput[] {
  switch (sort) {
    case "rating": return [{ imdbRating: { sort: "desc", nulls: "last" } }, { views: "desc" }];
    case "newest": return [{ createdAt: "desc" }];
    case "year": return [{ year: "desc" }, { title: "asc" }];
    case "title": return [{ title: "asc" }];
    default: return [{ views: "desc" }, { imdbRating: { sort: "desc", nulls: "last" } }];
  }
}

export async function browseMovies(p: BrowseParams, pageSize = PAGE_SIZE) {
  const page = p.page ?? 1;
  const where = movieWhere(p);
  const [total, rows] = await Promise.all([
    db.movie.count({ where }),
    db.movie.findMany({ where, orderBy: movieOrder(p.sort), skip: (page - 1) * pageSize, take: pageSize, select: movieCardSelect }),
  ]);
  return { items: rows.map(toMovieCard), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function browseSeries(p: BrowseParams, pageSize = PAGE_SIZE) {
  const page = p.page ?? 1;
  const and: Prisma.SeriesWhereInput[] = [published];
  if (p.q) and.push({ title: { contains: p.q, mode: "insensitive" } });
  if (p.genre) and.push({ genres: { some: { genre: { slug: p.genre } } } });
  if (p.year) and.push({ startYear: p.year });
  else if (p.decade) and.push({ startYear: { gte: p.decade, lt: p.decade + 10 } });
  const where = { AND: and };
  const orderBy: Prisma.SeriesOrderByWithRelationInput[] =
    p.sort === "rating" ? [{ imdbRating: { sort: "desc", nulls: "last" } }]
    : p.sort === "newest" ? [{ createdAt: "desc" }]
    : p.sort === "title" ? [{ title: "asc" }]
    : p.sort === "year" ? [{ startYear: "desc" }]
    : [{ views: "desc" }];
  const [total, rows] = await Promise.all([
    db.series.count({ where }),
    db.series.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: seriesCardSelect }),
  ]);
  return { items: rows.map(toSeriesCard), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Live search for the overlay: titles, actors and series in one call. */
export async function quickSearch(q: string) {
  const [movies, series, actors] = await Promise.all([
    browseMovies({ q, sort: "popular" }, 8),
    browseSeries({ q }, 4),
    db.actor.findMany({
      where: { name: { contains: q, mode: "insensitive" }, credits: { some: { movie: published } } },
      select: { id: true, name: true, _count: { select: { credits: true } } },
      take: 5,
    }),
  ]);
  return { movies: movies.items, series: series.items, actors: actors.map((a) => ({ id: a.id, name: a.name, count: a._count.credits })) };
}

export const getGenres = cache(() => db.genre.findMany({ orderBy: { name: "asc" } }));

export async function genresWithCounts() {
  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true,
      _count: { select: { movies: { where: { movie: published } }, series: { where: { series: published } } } },
      movies: { where: { movie: { ...published, backdropUrl: { not: null } } }, take: 1, select: { movie: { select: { backdropUrl: true } } }, orderBy: { movie: { views: "desc" } } },
    },
  });
  return genres.map((g) => ({ id: g.id, name: g.name, slug: g.slug, count: g._count.movies + g._count.series, image: g.movies[0]?.movie.backdropUrl ?? null }));
}

export const getMovie = cache(async (slug: string) =>
  db.movie.findFirst({
    where: { slug, ...published },
    include: {
      genres: { include: { genre: true } },
      cast: { include: { actor: true }, orderBy: { order: "asc" } },
      sources: { include: { subtitles: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      _count: { select: { ratings: true } },
    },
  }),
);

export async function similarMovies(movieId: string, genreIds: string[], take = 12) {
  if (!genreIds.length) return moviesBy([{ views: "desc" }], take, { id: { not: movieId } });
  const rows = await db.movie.findMany({
    where: { ...published, id: { not: movieId }, genres: { some: { genreId: { in: genreIds } } } },
    select: { ...movieCardSelect, genres: { select: { genreId: true, genre: { select: { name: true } } } } },
    take: 60,
  });
  return rows
    .map((r) => ({ r, overlap: r.genres.filter((g) => genreIds.includes(g.genreId)).length }))
    .sort((a, b) => b.overlap - a.overlap || Number(b.r.imdbRating ?? 0) - Number(a.r.imdbRating ?? 0))
    .slice(0, take)
    .map(({ r }) => toMovieCard(r));
}

export const getSeries = cache(async (slug: string) =>
  db.series.findFirst({
    where: { slug, ...published },
    include: {
      genres: { include: { genre: true } },
      seasons: {
        orderBy: { number: "asc" },
        include: { episodes: { orderBy: { number: "asc" }, include: { _count: { select: { sources: true } } } } },
      },
    },
  }),
);

export async function getEpisode(id: string) {
  const ep = await db.episode.findUnique({
    where: { id },
    include: {
      sources: { include: { subtitles: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      season: { include: { series: true } },
    },
  });
  if (!ep || !ep.season.series.published) return null;
  // Next episode: next number in this season, else first episode of the next season.
  const next =
    (await db.episode.findFirst({ where: { seasonId: ep.seasonId, number: { gt: ep.number } }, orderBy: { number: "asc" }, select: { id: true, title: true, number: true, season: { select: { number: true } } } })) ??
    (await db.episode.findFirst({
      where: { season: { seriesId: ep.season.seriesId, number: { gt: ep.season.number } } },
      orderBy: [{ season: { number: "asc" } }, { number: "asc" }],
      select: { id: true, title: true, number: true, season: { select: { number: true } } },
    }));
  return { ep, next };
}

export async function countView(kind: "movie" | "series", id: string) {
  if (kind === "movie") await db.movie.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
  else await db.series.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
}
