import { GenreManager } from "@/components/admin/Managers";
import { db } from "@/lib/db";
import { AdminHeader } from "../AdminHeader";

export default async function AdminGenres() {
  const genres = await db.genre.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { movies: true, series: true } } } });
  return (
    <>
      <AdminHeader title="Genres" sub="Genres power the homepage rows, filters and recommendations." />
      <GenreManager genres={genres.map((g) => ({ id: g.id, name: g.name, slug: g.slug, movies: g._count.movies, series: g._count.series }))} />
    </>
  );
}
