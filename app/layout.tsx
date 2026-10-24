import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lidde Fun — Discover, Trade & Quest",
  description: "Discovery and quests terminal for Lidde. Preview only: illustrative assets, local quest drafts, no live rewards or transactions.",
  robots: { index: false, follow: false }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
