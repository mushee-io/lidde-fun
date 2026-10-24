import { vaultAbi } from "@/lib/quests/vault-abi";
import "server-only";
import { getAddress, isAddress, keccak256, zeroAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { probeNetwork } from "@/lib/infra/probe";


const address=(v:string)=>isAddress(v)&&v.toLowerCase()!==zeroAddress;
const isHash=(v:string)=>/^0x[0-9a-fA-F]{64}$/.test(v);

export async function verifiedVault(){
 const probe=await probeNetwork();
 if(probe.info.status!=="verified"||!probe.config||!probe.client)throw new Error("Quest blockchain is not verified.");
 const contract=process.env.LIDDE_FUN_QUEST_VAULT_ADDRESS?.trim()??"";
 const pinned=process.env.LIDDE_FUN_QUEST_VAULT_CODE_HASH?.trim()??"";
 if(!address(contract)||!isHash(pinned))throw new Error("QuestEscrow address and codehash are not configured.");
 const vault=getAddress(contract);
 const code=await probe.client.getBytecode({address:vault});
 if(!code||code==="0x"||keccak256(code).toLowerCase()!==pinned.toLowerCase())
  throw new Error("QuestEscrow bytecode does not match its pinned deployment hash.");
 return {vault,client:probe.client,config:probe.config};
}
export async function deployedCampaign(onchainId:bigint){
 if(onchainId<=0n)throw new Error("On-chain campaign ID required.");
 const observed=await verifiedVault();
 const campaign=await observed.client.readContract({
  address:observed.vault,abi:vaultAbi,functionName:"campaigns",args:[onchainId]
 });
 if(campaign[0]===zeroAddress)throw new Error("Campaign is not deployed to QuestEscrow.");
 const budget=BigInt(campaign[3])*BigInt(campaign[4]);
 return { ...observed,
   campaign:{creator:campaign[0],rewardToken:campaign[1],attestor:campaign[2],
    amountPerClaim:campaign[3],maxClaims:campaign[4],claimCount:campaign[5],
    starts:campaign[6],ends:campaign[7],funded:campaign[8],distributed:campaign[9],
    paused:campaign[10],finalized:campaign[11],budget} };
}
export function claimSigner(){
 const key=process.env.LIDDE_FUN_QUEST_ATTESTOR_PRIVATE_KEY;
 if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key))throw new Error("Secure quest attestor is not provisioned.");
 return privateKeyToAccount(key as Hex);
}
export const questTypedData={
 Claim:[
  {name:"campaignId",type:"uint256"},
  {name:"wallet",type:"address"},
  {name:"evidenceHash",type:"bytes32"},
  {name:"nonce",type:"uint256"},
  {name:"deadline",type:"uint256"}
 ]
} as const;
export function typedDomain(chainId:number,vault:Address){
 return {name:"Lidde Fun QuestEscrow",version:"1",chainId,verifyingContract:vault} as const;
}
