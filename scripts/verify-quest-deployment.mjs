import {createPublicClient,http,keccak256,parseAbi,getAddress} from "viem";
const rpc=process.env.LIDDE_FUN_RPC_URL??"";
const id=Number(process.env.LIDDE_FUN_TESTNET_CHAIN_ID);
const vault=process.env.LIDDE_FUN_QUEST_VAULT_ADDRESS??"";
const expectedHash=process.env.LIDDE_FUN_QUEST_VAULT_CODE_HASH??"";
if(!/^https:\/\//.test(rpc) && !/^http:\/\/127\.0\.0\.1:/.test(rpc))
 throw Error("Only trusted HTTPS RPC or local disposable Anvil supported.");
if(!Number.isSafeInteger(id)||id<=1000||[1,56,137,8453,4613].includes(id))
 throw Error("Invalid chain ID for valueless sandbox.");
if(!/^0x[a-fA-F0-9]{40}$/.test(vault))throw Error("Provide actual QuestEscrow address.");
const client=createPublicClient({transport:http(rpc,{timeout:12000,retryCount:0})});
if(await client.getChainId()!==id)throw Error("QuestEscrow verification on incorrect chain.");
const code=await client.getBytecode({address:getAddress(vault)});
if(!code||code==="0x")throw Error("No deployed QuestEscrow code.");
const hash=keccak256(code);
if(expectedHash && hash.toLowerCase()!==expectedHash.toLowerCase())
 throw Error("QuestEscrow hash disagrees with pinned operator declaration.");
const abi=parseAbi(["function nextCampaignId() view returns(uint256)","function domainSeparator() view returns(bytes32)"]);
const [nextCampaignId,domain]=await Promise.all([
 client.readContract({address:getAddress(vault),abi,functionName:"nextCampaignId"}),
 client.readContract({address:getAddress(vault),abi,functionName:"domainSeparator"})
]);
if(nextCampaignId<1n||!/^0x[0-9a-f]{64}$/i.test(domain))
 throw Error("QuestEscrow ABI probe failed.");
const genesis=await client.getBlock({blockNumber:0n});
console.log(JSON.stringify({verified:true,chainId:id,genesis:genesis.hash,vault,
 codeHash:hash,nextCampaignId:nextCampaignId.toString(),domainSeparator:domain,
 note:"Code exists and responds; this does not constitute independent contract audit."},null,2));
