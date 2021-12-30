import { ethers } from "ethers";
import fs from "fs";
import { StarknetContract } from "hardhat/types/runtime";

export const CHAIN_DEPLOYMENTS_DIR = "./chain-deployments";
const MASK_250 = BigInt(2 ** 250 - 1);

export function save(
  name: string,
  contract: any,
  network: string,
  deployment: string
) {
  fs.writeFileSync(
    `${CHAIN_DEPLOYMENTS_DIR}/${deployment}/${name}.json`,
    JSON.stringify({
      network,
      address: contract.address,
    })
  );
}

export function getSelectorFromName(name: string) {
  return (
    BigInt(ethers.utils.keccak256(Buffer.from(name))) % MASK_250
  ).toString();
}

export async function callFrom(
  contract: StarknetContract,
  call: string,
  calldata: any[] | any,
  caller: StarknetContract
) {
  const selector = getSelectorFromName(call);
  const _calldata = flatten(calldata);
  return caller.invoke("execute", {
    to: BigInt(contract.address).toString(),
    selector,
    calldata: _calldata,
  });
}

function flatten(calldata: any): any[] {
  const res: any = [];
  Object.values(calldata).forEach((data: any) => {
    if (typeof data === "object") {
      res.push(...data);
    } else {
      res.push(data);
    }
  });
  return res;
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Please provide ${key} as an env var`);
  }

  return value;
}
