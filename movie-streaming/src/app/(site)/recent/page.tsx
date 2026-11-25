import type { Metadata } from "next";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { Pagination } from "@/components/ui/Pagination";
import { readBrowseParams, type SearchParams } from "@/lib/browse";
import { browseMovies } from "@/services/catalog";

export const metadata: Metadata = { title: "Recently added" };

export default async function RecentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readBrowseParams(searchParams);
  const result = await browseMovies({ ...params, sort: "newest" });
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow="Fresh on Nocturne" title="Recently added">The newest additions to the catalogue, latest first.</PageHeader>
      <BrowseGrid items={result.items} />
      <Pagination page={result.page} pages={result.pages} params={{}} basePath="/recent" />
    </div>
  );
}
