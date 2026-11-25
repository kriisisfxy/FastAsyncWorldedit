import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#3a1d8f_0%,#140b2e_45%,#090909_80%)]" />
        <div className="absolute left-[18%] top-[22%] size-[42vh] rounded-full bg-[radial-gradient(circle_at_35%_35%,#c4b0ff,#7c4dff_45%,#2a1166_80%)] shadow-[0_0_160px_40px_rgb(124_77_255/0.35)]" />
        <div className="absolute left-[26%] top-[16%] size-[40vh] rounded-full bg-[#0d0a18]" />
        <div className="absolute inset-x-12 bottom-14">
          <p className="font-serif text-5xl italic leading-tight text-white/90">“The lights go down.<br />The story begins.”</p>
          <p className="mt-4 text-sm text-soft">Thousands of hours of cinema, one quiet place to watch it.</p>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
