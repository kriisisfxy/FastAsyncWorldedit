import { pageParam, str } from "./utils";
import type { BrowseParams } from "@/services/catalog";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS = ["popular", "rating", "newest", "year", "title"] as const;

export async function readBrowseParams(sp: SearchParams): Promise<BrowseParams & { raw: Record<string, string | undefined> }> {
  const p = await sp;
  const year = Number(str(p.year));
  const decade = Number(str(p.decade));
  const sort = str(p.sort) as BrowseParams["sort"];
  const raw = { q: str(p.q), genre: str(p.genre), year: str(p.year), decade: str(p.decade), sort: str(p.sort) };
  return {
    q: str(p.q)?.slice(0, 80),
    genre: str(p.genre)?.slice(0, 40),
    year: year >= 1870 && year <= 2100 ? year : undefined,
    decade: decade >= 1870 && decade <= 2100 && decade % 10 === 0 ? decade : undefined,
    sort: sort && (SORTS as readonly string[]).includes(sort) ? sort : "popular",
    page: pageParam(p.page),
    raw,
  };
}

export const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930, 1920, 1910, 1900];
