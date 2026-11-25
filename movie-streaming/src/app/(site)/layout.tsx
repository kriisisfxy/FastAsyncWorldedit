import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { currentUser } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <Navbar user={user ? { name: user.name, image: user.image, role: user.role } : null} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
