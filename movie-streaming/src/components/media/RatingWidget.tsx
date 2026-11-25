"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarIcon } from "@/components/ui/Icons";

export function RatingWidget({ movieId, initial, community, signedIn }: { movieId: string; initial: number | null; community: { avg: number | null; count: number }; signedIn: boolean }) {
  const [value, setValue] = useState(initial);
  const [hover, setHover] = useState<number | null>(null);
  const [stats, setStats] = useState(community);
  const router = useRouter();

  const rate = async (v: number) => {
    if (!signedIn) return router.push(`/login?callbackUrl=${encodeURIComponent(location.pathname)}`);
    const prev = value;
    setValue(v);
    const res = await fetch("/api/me/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ movieId, value: v }) });
    if (!res.ok) return setValue(prev);
    setStats((await res.json()).community);
  };

  const shown = hover ?? value ?? 0;
  return (
    <div>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Your rating">
        {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} out of 10`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => rate(n)}
            className="grid size-7 place-items-center rounded transition hover:scale-110"
          >
            <StarIcon className={n <= shown ? "size-5 text-violet-2" : "size-5 text-white/15"} />
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] text-mute">
        {value ? `You rated ${value}/10` : "Rate this film"}
        {stats.count > 0 && stats.avg !== null && ` · Nocturne viewers ${stats.avg.toFixed(1)} (${stats.count})`}
      </p>
    </div>
  );
}
