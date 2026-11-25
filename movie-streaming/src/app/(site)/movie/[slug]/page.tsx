import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Artwork } from "@/components/media/Artwork";
import { MediaRow, RowItem } from "@/components/media/MediaRow";
import { MovieCard } from "@/components/media/MovieCard";
import { RatingWidget } from "@/components/media/RatingWidget";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { PlayIcon, StarIcon } from "@/components/ui/Icons";
import { currentUser } from "@/lib/session";
import { formatRuntime, formatTime } from "@/lib/utils";
import { getMovie, similarMovies } from "@/services/catalog";
import { communityRating, getProgress, isInWatchlist, userRating } from "@/services/library";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getMovie((await params).slug);
  if (!movie) return { title: "Not found" };
  return {
    title: `${movie.title} (${movie.year})`,
    description: movie.description.slice(0, 160),
    openGraph: { images: movie.backdropUrl && !movie.backdropUrl.endsWith(".svg") ? [movie.backdropUrl] : [] },
  };
}

const ROLE_LABEL = { DIRECTOR: "Director", WRITER: "Writer", PRODUCER: "Producer", COMPOSER: "Music" } as const;

export default async function MoviePage({ params }: Props) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) notFound();
  const user = await currentUser();
  const genreIds = movie.genres.map((g) => g.genreId);
  const [similar, inList, mine, community, resumeAt] = await Promise.all([
    similarMovies(movie.id, genreIds),
    isInWatchlist(user?.id, { movieId: movie.id }),
    userRating(user?.id, movie.id),
    communityRating(movie.id),
    user ? getProgress(user.id, { movieId: movie.id }) : Promise.resolve(0),
  ]);

  const actors = movie.cast.filter((c) => c.role === "ACTOR");
  const crew = movie.cast.filter((c) => c.role !== "ACTOR");
  const crewByRole = Object.entries(
    crew.reduce<Record<string, string[]>>((acc, c) => ((acc[c.role] ??= []).push(c.actor.name), acc), {}),
  );
  const playable = movie.sources.length > 0;
  const runtime = formatRuntime(movie.runtime);
  const rating = movie.imdbRating === null ? null : Number(movie.imdbRating);

  return (
    <article>
      <section className="grain relative isolate min-h-[72svh] overflow-hidden pb-14 pt-28 sm:pt-36">
        <div className="absolute inset-0 -z-10">
          <Artwork src={movie.backdropUrl ?? movie.posterUrl} alt="" sizes="100vw" priority className="opacity-70" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#090909_8%,rgb(9_9_9/0.7)_45%,rgb(9_9_9/0.2))]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#090909,transparent_55%)]" />

        <div className="flex flex-col gap-8 px-[max(4vw,16px)] md:flex-row md:items-end md:gap-12">
          <div className="relative aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 sm:w-56 lg:w-64">
            <Artwork src={movie.posterUrl} alt={`${movie.title} poster`} sizes="256px" priority fallbackTitle={movie.title} />
          </div>
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <Link key={g.genreId} href={`/genres/${g.genre.slug}`} className="chip h-8 bg-white/5 backdrop-blur">{g.genre.name}</Link>
              ))}
            </div>
            <h1 className="mt-4 font-display text-[clamp(38px,6vw,76px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-balance">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 font-serif text-2xl italic text-violet-2">{movie.tagline}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-soft">
              {rating !== null && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  <span className="rounded bg-gold px-1.5 py-px text-[11px] font-extrabold text-ink">IMDb</span>
                  {rating.toFixed(1)} <StarIcon className="size-3.5 text-gold" />
                </span>
              )}
              <span>{movie.releaseDate ? movie.releaseDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : movie.year}</span>
              {runtime && <span>{runtime}</span>}
              {movie.ageRating && <span className="rounded border border-white/25 px-1.5 text-xs font-semibold">{movie.ageRating}</span>}
            </div>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-soft">{movie.description}</p>

            <div className="mt-8 flex flex-wrap items-start gap-3">
              {playable ? (
                <Link href={`/watch/movie/${movie.slug}`} className="btn-primary h-12 px-7 text-base">
                  <PlayIcon className="size-5" />
                  {resumeAt > 15 ? `Resume from ${formatTime(resumeAt)}` : "Watch movie"}
                </Link>
              ) : (
                <span className="btn h-12 cursor-not-allowed bg-white/10 px-7 text-base text-mute" aria-disabled>Coming soon</span>
              )}
              <WatchlistButton movieId={movie.id} initial={inList} signedIn={!!user} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-12 px-[max(4vw,16px)] py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h2 className="font-display text-xl font-bold">Cast</h2>
          {actors.length ? (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {actors.map((c) => (
                <li key={c.id}>
                  <Link href={`/search?q=${encodeURIComponent(c.actor.name)}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet/40 to-ink-3 font-display font-bold">
                      {c.actor.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.actor.name}</span>
                      {c.character && <span className="block truncate text-sm text-mute">{c.character}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-mute">Cast information hasn’t been added yet.</p>
          )}
        </section>
        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-mute">Crew</h2>
            <dl className="mt-3 space-y-2.5 text-[15px]">
              {crewByRole.length ? crewByRole.map(([role, names]) => (
                <div key={role} className="flex gap-4">
                  <dt className="w-20 shrink-0 text-mute">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}</dt>
                  <dd>{names.join(", ")}</dd>
                </div>
              )) : <p className="text-mute">Not listed.</p>}
            </dl>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-mute">Your rating</h2>
            <RatingWidget movieId={movie.id} initial={mine} community={community} signedIn={!!user} />
          </div>
        </aside>
      </div>

      <MediaRow title="More like this" count={similar.length}>
        {similar.map((m) => <RowItem key={m.id}><MovieCard item={m} /></RowItem>)}
      </MediaRow>
    </article>
  );
}
