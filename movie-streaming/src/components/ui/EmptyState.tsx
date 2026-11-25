export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <div className="mx-auto mb-5 size-14 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bff,#5b2bd9)] opacity-80" />
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children && <div className="mt-2 text-[15px] leading-relaxed text-mute">{children}</div>}
    </div>
  );
}
