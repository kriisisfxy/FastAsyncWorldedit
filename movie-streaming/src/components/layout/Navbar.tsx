"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/genres", label: "Genres" },
  { href: "/recent", label: "Recently Added" },
];

type NavUser = { name?: string | null; image?: string | null; role: "USER" | "ADMIN" } | null;

export function Navbar({ user }: { user: NavUser }) {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [account, setAccount] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setAccount(false);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable]");
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearch(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccount(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background,box-shadow,backdrop-filter] duration-500",
          scrolled || menu ? "bg-ink/85 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl" : "bg-gradient-to-b from-ink/80 to-transparent",
        )}
      >
        <nav className="flex h-[68px] items-center gap-6 px-[max(4vw,16px)]" aria-label="Main">
          <Logo />
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  className={cn("relative rounded-full px-3.5 py-2 text-[14.5px] font-medium transition", active(l.href) ? "text-white" : "text-soft hover:text-white")}
                >
                  {active(l.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearch(true)}
              className="flex h-11 items-center gap-2.5 rounded-full px-3 text-soft transition hover:bg-white/10 hover:text-white sm:pr-4 sm:ring-1 sm:ring-inset sm:ring-white/10"
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
              <span className="hidden text-sm sm:inline">Search</span>
              <kbd className="hidden rounded border border-white/15 px-1.5 text-[11px] text-mute md:inline">/</kbd>
            </button>

            {user ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccount((v) => !v)}
                  className="grid size-11 place-items-center rounded-full transition hover:bg-white/10"
                  aria-haspopup="menu"
                  aria-expanded={account}
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} image={user.image} />
                </button>
                <AnimatePresence>
                  {account && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-line bg-ink-2/95 p-1.5 shadow-2xl backdrop-blur-xl"
                    >
                      <p className="truncate px-3 pb-2 pt-2.5 text-sm font-semibold">{user.name}</p>
                      <MenuLink href="/profile">Profile & history</MenuLink>
                      <MenuLink href="/my-list">My list</MenuLink>
                      {user.role === "ADMIN" && <MenuLink href="/admin">Admin dashboard</MenuLink>}
                      <div className="my-1 h-px bg-line" />
                      <button
                        role="menuitem"
                        onClick={async () => {
                          const { signOut } = await import("next-auth/react");
                          await signOut({ callbackUrl: "/" });
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-soft transition hover:bg-white/5 hover:text-white"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn-violet ml-1 h-10 px-4 text-sm">
                <UserIcon className="size-4" /> Sign in
              </Link>
            )}

            <button onClick={() => setMenu((v) => !v)} className="grid size-11 place-items-center rounded-full hover:bg-white/10 lg:hidden" aria-label="Menu" aria-expanded={menu}>
              {menu ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menu && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-[max(4vw,16px)] lg:hidden"
            >
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={cn("block border-t border-white/5 py-4 text-lg font-semibold", active(l.href) ? "text-violet-2" : "text-white")}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </header>
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="block rounded-xl px-3 py-2.5 text-sm text-soft transition hover:bg-white/5 hover:text-white">
      {children}
    </Link>
  );
}

export function Avatar({ name, image, size = 34 }: { name?: string | null; image?: string | null; size?: number }) {
  if (image) {
    return <Image src={image} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-violet/40" style={{ width: size, height: size }} unoptimized={image.endsWith(".svg")} />;
  }
  return (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-violet-2 to-violet-deep font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(name ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
