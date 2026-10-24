import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { fixedSix, type AlertRuleType } from "@/lib/growth/simulation";
export type WatchSpec={
 type:AlertRuleType;pair:Address;thresholdSix:bigint|null;
};
export function validateWatch(input:unknown):WatchSpec{
 if(!input||typeof input!=="object")throw new Error("Watch rule must be an object.");
 const x=input as Record<string,unknown>;
 if(!["price_above","price_below","new_pair"].includes(String(x.type)))
  throw new Error("Unsupported watch signal.");
 const type=x.type as AlertRuleType;
 if(type==="new_pair"){
  if(x.pair&&x.pair!==zeroAddress)throw new Error("New-pair alerts watch the factory, not a pre-existing pair.");
  return {type,pair:zeroAddress,thresholdSix:null};
 }
 if(typeof x.pair!=="string"||!isAddress(x.pair)||x.pair.toLowerCase()===zeroAddress)
  throw new Error("Price alerts require a concrete indexed pair.");
 if(typeof x.threshold!=="string")throw new Error("Price threshold is required.");
 return {type,pair:getAddress(x.pair),thresholdSix:fixedSix(x.threshold)};
}
