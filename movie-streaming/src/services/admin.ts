import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getProvider } from "@/lib/providers";
import { slugify } from "@/lib/utils";
import type { MovieInput, SeriesInput } from "@/lib/validation";
import type { z } from "zod";
import type { sourceSchema, castSchema } from "@/lib/validation";

type SourceInput = z.infer<typeof sourceSchema>;
type CastInput = z.infer<typeof castSchema>;

/** Validates each source with its provider module and returns nested-create data. */
export function buildSources(sources: SourceInput[]) {
  const hasPrimary = sources.some((s) => s.isPrimary);
  return sources.map((s, i) => {
    let ref: string;
    try {
      ref = getProvider(s.provider).normalize(s.ref);
    } catch (e) {
      throw new HttpError(422, `Video source ${i + 1}: ${(e as Error).message}`);
    }
    return {
      provider: s.provider,
      ref,
      label: s.label || "Default",
      quality: s.quality || null,
      language: s.language || null,
      isPrimary: hasPrimary ? s.isPrimary : i === 0,
      subtitles: { create: s.subtitles.map((t) => ({ language: t.language, label: t.label, url: t.url })) },
    };
  });
}

async function castCreates(cast: CastInput[]) {
  const seen = new Set<string>();
  const out: { actorId: string; role: CastInput["role"]; character: string | null; order: number }[] = [];
  for (const [i, c] of cast.entries()) {
    const key = `${c.name.toLowerCase()}|${c.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const actor = await db.actor.upsert({ where: { name: c.name }, update: {}, create: { name: c.name } });
    out.push({ actorId: actor.id, role: c.role, character: c.character || null, order: i });
  }
  return out;
}

async function uniqueSlug(base: string, table: "movie" | "series", exceptId?: string) {
  const root = slugify(base) || "title";
  for (let i = 0; i < 50; i++) {
    const slug = i ? `${root}-${i + 1}` : root;
    const hit =
      table === "movie"
        ? await db.movie.findUnique({ where: { slug }, select: { id: true } })
        : await db.series.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
  }
  throw new HttpError(409, "Could not create a unique slug.");
}

function movieScalars(input: MovieInput) {
  return {
    title: input.title,
    tagline: input.tagline || null,
    description: input.description,
    releaseDate: input.releaseDate ? new Date(input.releaseDate + "T00:00:00Z") : null,
    year: input.year,
    runtime: input.runtime ?? null,
    imdbRating: input.imdbRating ?? null,
    ageRating: input.ageRating || null,
    posterUrl: input.posterUrl ?? null,
    backdropUrl: input.backdropUrl ?? null,
    featured: input.featured,
    published: input.published,
  };
}

export async function createMovie(input: MovieInput) {
  const slug = await uniqueSlug(input.slug || input.title, "movie");
  const cast = await castCreates(input.cast);
  const sources = buildSources(input.sources);
  return db.movie.create({
    data: {
      ...movieScalars(input),
      slug,
      genres: { create: input.genreIds.map((genreId) => ({ genreId })) },
      cast: { create: cast },
      sources: { create: sources },
    },
  });
}

export async function updateMovie(id: string, input: MovieInput) {
  const slug = await uniqueSlug(input.slug || input.title, "movie", id);
  const cast = await castCreates(input.cast);
  const sources = buildSources(input.sources);
  return db.$transaction(async (tx) => {
    await tx.movieGenre.deleteMany({ where: { movieId: id } });
    await tx.movieCast.deleteMany({ where: { movieId: id } });
    await tx.videoSource.deleteMany({ where: { movieId: id } });
    return tx.movie.update({
      where: { id },
      data: {
        ...movieScalars(input),
        slug,
        genres: { create: input.genreIds.map((genreId) => ({ genreId })) },
        cast: { create: cast },
        sources: { create: sources },
      },
    });
  });
}

function seriesScalars(input: SeriesInput) {
  return {
    title: input.title,
    description: input.description,
    startYear: input.startYear,
    endYear: input.endYear ?? null,
    imdbRating: input.imdbRating ?? null,
    posterUrl: input.posterUrl ?? null,
    backdropUrl: input.backdropUrl ?? null,
    featured: input.featured,
    published: input.published,
  };
}

export async function createSeries(input: SeriesInput) {
  const slug = await uniqueSlug(input.slug || input.title, "series");
  return db.series.create({
    data: { ...seriesScalars(input), slug, genres: { create: input.genreIds.map((genreId) => ({ genreId })) } },
  });
}

export async function updateSeries(id: string, input: SeriesInput) {
  const slug = await uniqueSlug(input.slug || input.title, "series", id);
  return db.$transaction(async (tx) => {
    await tx.seriesGenre.deleteMany({ where: { seriesId: id } });
    return tx.series.update({
      where: { id },
      data: { ...seriesScalars(input), slug, genres: { create: input.genreIds.map((genreId) => ({ genreId })) } },
    });
  });
}

export async function siteStats() {
  const since = new Date(Date.now() - 7 * 864e5);
  const [users, admins, movies, series, episodes, sources, newUsers, activeViewers, views, topMovies, recentUsers, daily] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.movie.count(),
    db.series.count(),
    db.episode.count(),
    db.videoSource.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.watchHistory.groupBy({ by: ["userId"], where: { updatedAt: { gte: since } } }).then((r) => r.length),
    db.movie.aggregate({ _sum: { views: true } }),
    db.movie.findMany({ orderBy: { views: "desc" }, take: 5, select: { id: true, title: true, views: true, slug: true } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
    db.$queryRaw<{ day: Date; plays: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', d)::date AS day, COUNT(w.id) AS plays
      FROM generate_series(now() - interval '13 days', now(), interval '1 day') d
      LEFT JOIN watch_history w ON date_trunc('day', w.updated_at) = date_trunc('day', d)
      GROUP BY 1 ORDER BY 1`),
  ]);
  return {
    users, admins, movies, series, episodes, sources, newUsers, activeViewers,
    totalViews: views._sum.views ?? 0,
    topMovies, recentUsers,
    daily: daily.map((d) => ({ day: new Date(d.day).toISOString().slice(0, 10), plays: Number(d.plays) })),
  };
}
