import Link from "next/link";

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 shrink-0" aria-label="Nocturne home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <circle cx="16" cy="16" r="11" fill="#8b5cff" />
        <circle cx="21" cy="12" r="9.5" fill="#090909" className="transition-transform duration-500 group-hover:translate-x-[3px]" />
      </svg>
      <span className="font-display text-[22px] font-extrabold tracking-[-0.025em] lowercase">
        nocturne{suffix && <span className="ml-2 align-middle text-xs font-semibold tracking-normal text-violet-2">{suffix}</span>}
      </span>
    </Link>
  );
}
