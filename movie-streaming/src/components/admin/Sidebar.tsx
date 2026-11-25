"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" },
  { href: "/admin/movies", label: "Movies", icon: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4" },
  { href: "/admin/series", label: "Series", icon: "M3 7h18v12H3zM8 3l4 4 4-4" },
  { href: "/admin/sources", label: "Video sources", icon: "M15 10l5-3v10l-5-3M3 6h12v12H3z" },
  { href: "/admin/genres", label: "Genres", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/admin/users", label: "Users", icon: "M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 18a3 3 0 0 0-3-3M4 18a3 3 0 0 1 3-3" },
];

export function Sidebar({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(n.href) ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium transition",
            isActive(n.href) ? "bg-violet/15 text-white ring-1 ring-inset ring-violet/30" : "text-soft hover:bg-white/5 hover:text-white",
          )}
        >
          <svg viewBox="0 0 24 24" className={cn("size-[18px]", isActive(n.href) ? "text-violet-2" : "text-mute")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
            <path d={n.icon} />
          </svg>
          {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-ink/90 px-4 backdrop-blur lg:hidden">
        <Logo href="/admin" suffix="Studio" />
        <button onClick={() => setOpen((v) => !v)} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Menu" aria-expanded={open}>
          {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>
      {open && <div className="border-b border-line bg-ink-2 p-3 lg:hidden">{nav}</div>}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-ink-2/60 p-4 lg:flex">
        <div className="mb-8 px-2 pt-1"><Logo href="/admin" suffix="Studio" /></div>
        {nav}
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <Link href="/" className="flex h-10 items-center rounded-xl px-3 text-sm text-soft hover:bg-white/5 hover:text-white">← Back to site</Link>
          <p className="truncate px-3 text-xs text-mute">Signed in as {name}</p>
        </div>
      </aside>
    </>
  );
}
