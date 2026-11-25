import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const display = Inter_Tight({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Nocturne — films after dark", template: "%s · Nocturne" },
  description: "Discover and stream films and series on Nocturne.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#090909", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${serif.variable}`}>
      <body className="font-sans min-h-dvh">{children}</body>
    </html>
  );
}
