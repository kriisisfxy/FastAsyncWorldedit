import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-[120px] font-extrabold leading-none tracking-tighter text-white/10">404</p>
        <h1 className="-mt-6 font-display text-3xl font-extrabold">This scene was cut.</h1>
        <p className="mt-3 text-mute">The page you’re looking for doesn’t exist or has been removed.</p>
        <Link href="/" className="btn-violet mt-7">Back to Nocturne</Link>
      </div>
    </div>
  );
}
