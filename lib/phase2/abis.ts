import { parseAbi } from "viem";

export const factoryAbi = parseAbi([
  "function getPair(address,address) view returns (address)"
]);
export const pairAbi = parseAbi([
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
]);
export const routerAbi = parseAbi([
  "function factory() view returns (address)",
  "function WETH() view returns (address)",
  "function getAmountsOut(uint256,address[]) view returns (uint256[])",
  "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) returns (uint256[])",
  "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) returns (uint256,uint256,uint256)",
  "function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)"
]);
export const creatorAbi = parseAbi([
  "function createToken(string,string,uint8,uint256,uint256) returns(address)",
  "event DemoTokenCreated(address indexed creator,address indexed token,string symbol,uint8 decimals,uint256 initialSupply,uint256 maxSupply)"
]);
