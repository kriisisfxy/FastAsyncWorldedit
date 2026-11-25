import { notFound } from "next/navigation";
import { EpisodeManager } from "@/components/admin/EpisodeManager";
import { DeleteButton } from "@/components/admin/RowActions";
import { SeriesForm } from "@/components/admin/SeriesForm";
import { db } from "@/lib/db";
import { providerList } from "@/lib/providers";
import { getGenres } from "@/services/catalog";
import { AdminHeader } from "../../AdminHeader";

export default async function EditSeries({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [s, genres] = await Promise.all([
    db.series.findUnique({
      where: { id },
      include: {
        genres: true,
        seasons: { orderBy: { number: "asc" }, include: { episodes: { orderBy: { number: "asc" }, include: { sources: { include: { subtitles: true } } } } } },
      },
    }),
    getGenres(),
  ]);
  if (!s) notFound();
  return (
    <>
      <AdminHeader title={s.title} sub="Series details, seasons and episodes">
        <DeleteButton url={`/api/admin/series/${s.id}`} label="this series" redirectTo="/admin/series" />
      </AdminHeader>
      <SeriesForm
        genres={genres}
        initial={{
          id: s.id, title: s.title, slug: s.slug, description: s.description, startYear: String(s.startYear), endYear: s.endYear ? String(s.endYear) : "",
          imdbRating: s.imdbRating !== null ? String(s.imdbRating) : "", posterUrl: s.posterUrl ?? "", backdropUrl: s.backdropUrl ?? "",
          featured: s.featured, published: s.published, genreIds: s.genres.map((g) => g.genreId),
        }}
      />
      <h2 className="mb-4 mt-12 font-display text-2xl font-bold">Seasons & episodes</h2>
      <EpisodeManager
        seriesId={s.id}
        providers={providerList}
        seasons={s.seasons.map((season) => ({
          id: season.id, number: season.number, title: season.title,
          episodes: season.episodes.map((e) => ({
            id: e.id, number: e.number, title: e.title, description: e.description, runtime: e.runtime, stillUrl: e.stillUrl,
            sources: e.sources.map((src) => ({
              provider: src.provider, ref: src.ref, label: src.label, quality: src.quality ?? "", language: src.language ?? "", isPrimary: src.isPrimary,
              subtitles: src.subtitles.map((t) => ({ language: t.language, label: t.label, url: t.url })),
            })),
          })),
        }))}
      />
    </>
  );
}
