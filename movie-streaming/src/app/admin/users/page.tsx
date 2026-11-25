import type { Prisma } from "@prisma/client";
import { UserActions } from "@/components/admin/Managers";
import { Pagination } from "@/components/ui/Pagination";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { pageParam, str } from "@/lib/utils";
import { AdminHeader } from "../AdminHeader";

const PER = 25;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = str(sp.q)?.slice(0, 80);
  const page = pageParam(sp.page);
  const me = await currentUser();
  const where: Prisma.UserWhereInput = q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {};
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER,
      select: { id: true, name: true, email: true, role: true, disabled: true, createdAt: true, _count: { select: { history: true, watchlist: true } } },
    }),
  ]);
  return (
    <>
      <AdminHeader title="Users" sub={`${total} accounts`} />
      <form className="mb-5"><input name="q" defaultValue={q} placeholder="Search name or email…" className="field max-w-sm" aria-label="Search users" /></form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs text-mute">
            <tr><th className="px-5 py-3 font-medium">User</th><th className="px-3 py-3 font-medium">Role</th><th className="px-3 py-3 font-medium">Joined</th><th className="px-3 py-3 text-right font-medium">Watched</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className={u.disabled ? "opacity-50" : undefined}>
                <td className="px-5 py-3"><p className="font-semibold">{u.name}</p><p className="text-xs text-mute">{u.email}</p></td>
                <td className="px-3 py-3">
                  <span className={u.role === "ADMIN" ? "rounded-full bg-violet/20 px-2.5 py-1 text-xs font-semibold text-violet-2" : "text-mute"}>{u.role === "ADMIN" ? "Admin" : "Member"}</span>
                  {u.disabled && <span className="ml-2 text-xs text-red-300">Disabled</span>}
                </td>
                <td className="px-3 py-3 text-mute">{u.createdAt.toLocaleDateString("en-GB")}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mute">{u._count.history}</td>
                <td className="px-5 py-3"><UserActions id={u.id} role={u.role} disabled={u.disabled} isSelf={u.id === me?.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} params={{ q }} basePath="/admin/users" />
    </>
  );
}
