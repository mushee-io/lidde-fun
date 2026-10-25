import {TradingWorkspace} from "@/components/workspace/workspace";
export const metadata={title:"Trader profile — Lidde Fun"};
export default async function Page({params}:{params:Promise<{address:string}>}){
 const {address}=await params;return <TradingWorkspace view="trader" address={address}/>;
}
