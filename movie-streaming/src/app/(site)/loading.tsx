export default function Loading() {
  return (
    <div className="px-[max(4vw,16px)] pt-32" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-ink-3" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-ink-2" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
