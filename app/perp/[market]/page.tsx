import {TradingWorkspace} from "@/components/workspace/workspace";
export const metadata={title:"Perpetual market research — Lidde Fun"};
export default async function Page({params}:{params:Promise<{market:string}>}){
 const {market}=await params;
 const allowed=["BTC","ETH","VERY"];
 return <TradingWorkspace view="perp" market={allowed.includes(market.toUpperCase())?market.toUpperCase():"BTC"}/>;
}
