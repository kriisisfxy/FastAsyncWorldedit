import { emptyMovie, MovieForm } from "@/components/admin/MovieForm";
import { providerList } from "@/lib/providers";
import { getGenres } from "@/services/catalog";
import { AdminHeader } from "../../AdminHeader";

export const metadata = { title: "New movie" };

export default async function NewMovie() {
  const genres = await getGenres();
  return (
    <>
      <AdminHeader title="New movie" sub="Add the details, artwork and at least one video source you are licensed to publish." />
      <MovieForm initial={emptyMovie} genres={genres} providers={providerList} />
    </>
  );
}
