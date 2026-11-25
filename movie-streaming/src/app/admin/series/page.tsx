import Link from "next/link";
import { DeleteButton, FlagToggle } from "@/components/admin/RowActions";
import { db } from "@/lib/db";
import { AdminHeader } from "../AdminHeader";

export default async function AdminSeries() {
  const series = await db.series.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, startYear: true, endYear: true, featured: true, published: true, seasons: { select: { _count: { select: { episodes: true } } } } },
  });
  return (
    <>
      <AdminHeader title="Series" sub={`${series.length} series`}>
        <Link href="/admin/series/new" className="btn-violet">Add series</Link>
      </AdminHeader>
      <div className="card divide-y divide-line">
        {series.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <Link href={`/admin/series/${s.id}`} className="min-w-0 flex-1 font-semibold hover:text-violet-2">
              {s.title} <span className="font-normal text-mute">({s.startYear}{s.endYear ? `–${s.endYear}` : "–"})</span>
            </Link>
            <span className="text-sm text-mute">{s.seasons.length} seasons · {s.seasons.reduce((a, x) => a + x._count.episodes, 0)} episodes</span>
            <FlagToggle url={`/api/admin/series/${s.id}`} field="published" value={s.published} label="Toggle published" />
            <FlagToggle url={`/api/admin/series/${s.id}`} field="featured" value={s.featured} label="Toggle featured" />
            <DeleteButton small url={`/api/admin/series/${s.id}`} label={`“${s.title}”`} />
          </div>
        ))}
        {!series.length && <p className="px-5 py-10 text-center text-mute">No series yet.</p>}
      </div>
    </>
  );
}
