import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={
 title:{default:"Lidde Fun — Discover, Trade & Quest",template:"%s"},
 description:"Lidde Fun — token discovery, launchpad, trading research, community leaderboards and verified valueless testnet quests on the VERY ecosystem.",
 robots:{index:false,follow:false}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
