import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={cn("inline-block size-5 rounded-full border-2 border-white/20 border-t-violet-2 animate-spin", className)} />
  );
}
