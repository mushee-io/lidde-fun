import {TradingWorkspace} from "@/components/workspace/workspace";
export const metadata={title:"Token detail — Lidde Fun"};
export default async function Page({params}:{params:Promise<{address:string}>}){
 const {address}=await params;return <TradingWorkspace view="token" address={address}/>;
}
