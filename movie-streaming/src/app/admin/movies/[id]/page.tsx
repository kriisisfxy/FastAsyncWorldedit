import { notFound } from "next/navigation";
import { MovieForm, type MovieDraft } from "@/components/admin/MovieForm";
import { DeleteButton } from "@/components/admin/RowActions";
import { db } from "@/lib/db";
import { providerList } from "@/lib/providers";
import { getGenres } from "@/services/catalog";
import { AdminHeader } from "../../AdminHeader";

export default async function EditMovie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [m, genres] = await Promise.all([
    db.movie.findUnique({
      where: { id },
      include: { genres: true, cast: { include: { actor: true }, orderBy: { order: "asc" } }, sources: { include: { subtitles: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } },
    }),
    getGenres(),
  ]);
  if (!m) notFound();
  const draft: MovieDraft = {
    id: m.id, title: m.title, slug: m.slug, tagline: m.tagline ?? "", description: m.description,
    releaseDate: m.releaseDate?.toISOString().slice(0, 10) ?? "", year: String(m.year), runtime: m.runtime ? String(m.runtime) : "",
    imdbRating: m.imdbRating !== null ? String(m.imdbRating) : "", ageRating: m.ageRating ?? "",
    posterUrl: m.posterUrl ?? "", backdropUrl: m.backdropUrl ?? "", featured: m.featured, published: m.published,
    genreIds: m.genres.map((g) => g.genreId),
    cast: m.cast.map((c) => ({ name: c.actor.name, role: c.role, character: c.character ?? "" })),
    sources: m.sources.map((s) => ({
      provider: s.provider, ref: s.ref, label: s.label, quality: s.quality ?? "", language: s.language ?? "", isPrimary: s.isPrimary,
      subtitles: s.subtitles.map((t) => ({ language: t.language, label: t.label, url: t.url })),
    })),
  };
  return (
    <>
      <AdminHeader title={m.title} sub={`Added ${m.createdAt.toLocaleDateString("en-GB")} · ${m.views.toLocaleString("en")} plays`}>
        <DeleteButton url={`/api/admin/movies/${m.id}`} label="this movie" redirectTo="/admin/movies" />
      </AdminHeader>
      <MovieForm initial={draft} genres={genres} providers={providerList} />
    </>
  );
}
