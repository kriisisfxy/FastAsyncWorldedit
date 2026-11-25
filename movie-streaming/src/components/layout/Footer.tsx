import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70 px-[max(4vw,16px)] py-12 text-sm text-mute">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 leading-relaxed">Films after dark. Every title is streamed from a source its publisher is licensed to use.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-2.5 sm:grid-cols-3">
          <Link href="/movies" className="hover:text-white">Movies</Link>
          <Link href="/series" className="hover:text-white">Series</Link>
          <Link href="/genres" className="hover:text-white">Genres</Link>
          <Link href="/recent" className="hover:text-white">Recently added</Link>
          <Link href="/my-list" className="hover:text-white">My list</Link>
          <Link href="/profile" className="hover:text-white">Account</Link>
        </div>
      </div>
      <p className="mt-10 text-xs text-mute/70">© {new Date().getFullYear()} Nocturne. Demo catalogue: Blender Foundation open movies (CC BY) and public-domain classics.</p>
    </footer>
  );
}
