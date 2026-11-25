import { emptySeries, SeriesForm } from "@/components/admin/SeriesForm";
import { getGenres } from "@/services/catalog";
import { AdminHeader } from "../../AdminHeader";

export const metadata = { title: "New series" };

export default async function NewSeries() {
  return (
    <>
      <AdminHeader title="New series" sub="Create the series first, then add seasons and episodes." />
      <SeriesForm initial={emptySeries} genres={await getGenres()} />
    </>
  );
}
