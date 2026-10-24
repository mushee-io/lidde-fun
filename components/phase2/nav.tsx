import Link from "next/link";
import { ArrowLeft, ChartNoAxesCombined, Coins, FlaskConical, Layers, Rocket, Wallet, Droplets, Trophy, Share2, Bell, FlaskRound } from "lucide-react";
const tabs = [
  { href: "/discover", name: "Discover", icon: ChartNoAxesCombined },
  { href: "/quests", name: "Quests", icon: Trophy },
  { href: "/leaderboard", name: "XP", icon: Trophy },
  { href: "/community", name: "Community", icon: Share2 },
  { href: "/alerts", name: "Alerts", icon: Bell },
  { href: "/lab", name: "Trading lab", icon: FlaskRound },
  { href: "/trade", name: "Spot", icon: Coins },
  { href: "/launch", name: "Token creator", icon: Rocket },
  { href: "/pools/create", name: "First pool", icon: Droplets },
  { href: "/portfolio", name: "Portfolio & LP", icon: Wallet },
  { href: "/markets", name: "Raw markets", icon: Layers },
  { href: "/network", name: "Network", icon: FlaskConical }
];
export function Phase2Nav() {
  return <nav className="phase2-nav" aria-label="Lidde Fun product navigation">
    <Link href="/" className="back"><ArrowLeft size={16}/> Lidde Fun</Link>
    {tabs.map(t => <Link href={t.href} key={t.href}><t.icon size={16}/>{t.name}</Link>)}
  </nav>;
}
export function Phase2Header({ title, subtitle, eyebrow }: { title: string; subtitle: string; eyebrow: string }) {
  return <div className="phase2-heading"><div><small>{eyebrow}</small><h1>{title}</h1><p>{subtitle}</p></div><span>ZERO-VALUE SANDBOX · NO REAL FUNDS</span></div>;
}
