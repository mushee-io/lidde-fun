/** Research ONLY: integer-accurate constant-product quote; no wallet or execution. */
export type PoolQuote={amountOut:bigint;minimumOut:bigint;priceImpactBps:number;feeBps:number};
export function simulateSpot(reserveIn:bigint,reserveOut:bigint,amountIn:bigint,
 feeBps=30,slippageBps=50):PoolQuote {
 if(reserveIn<=0n||reserveOut<=0n||amountIn<=0n||amountIn>2n**192n-1n)
  throw new Error("Positive canonical reserves and trade amount required.");
 if(!Number.isInteger(feeBps)||feeBps<0||feeBps>200||
    !Number.isInteger(slippageBps)||slippageBps<10||slippageBps>500)
  throw new Error("Unsafe fee or slippage bounds.");
 const afterFee=amountIn*BigInt(10000-feeBps);
 const output=afterFee*reserveOut/(reserveIn*10000n+afterFee);
 if(output<=0n||output>=reserveOut)throw new Error("Sandbox pool too thin for this request.");
 // Compare execution quote to BEFORE-trade reserve ratio, excluding fee from impact.
 const impact=10000n- output*reserveIn*10000n/(amountIn*reserveOut);
 const minimum=output*BigInt(10000-slippageBps)/10000n;
 if(minimum<=0n)throw new Error("Minimum output rounded to zero.");
 return {amountOut:output,minimumOut:minimum,priceImpactBps:Number(impact>10000n?10000n:impact),feeBps};
}
export type AlertRuleType="price_above"|"price_below"|"new_pair";
export function fixedSix(raw:string):bigint {
 if(!/^(?:0|[1-9]\d{0,30})(?:\.\d{1,6})?$/.test(raw))throw new Error("Enter a positive number with at most six decimals.");
 const [whole,fraction=""]=raw.split(".");
 const result=BigInt(whole)*1_000_000n+BigInt(fraction.padEnd(6,"0")||"0");
 if(result<=0n)throw new Error("Threshold must be greater than zero.");
 return result;
}
export function checkAlert(type:AlertRuleType,ratio:bigint|null,threshold:bigint|null,
  createdBlock:bigint,addedBlock:bigint):boolean{
 if(type==="new_pair")return createdBlock>addedBlock;
 if(ratio===null||threshold===null||threshold<=0n)return false;
 if(type==="price_above")return ratio>threshold;
 if(type==="price_below")return ratio<threshold;
 return false;
}
export function formatFixedSix(value:bigint):string {
 return (value/1_000_000n).toString()+"."+ (value%1_000_000n).toString().padStart(6,"0").replace(/0+$/,"").padEnd(1,"0");
}
