import { ethers } from "ethers";
import fs from "fs";
import { StarknetContract } from "hardhat/types/runtime";

const DEPLOYMENTS_DIR = `deployments`;
const MASK_250 = BigInt(2 ** 250 - 1);

export function getAddress(contract: string, network: string) {
  try {
    return JSON.parse(
      fs.readFileSync(`./deployments/${network}/${contract}.json`).toString()
    ).address;
  } catch (err) {
    throw Error(
      `${contract} deployment on ${network} not found, run 'yarn deploy:${network}'`
    );
  }
}

export function getAccounts(network: string) {
  const files = fs.readdirSync(`./deployments/${network}`);
  return files
    .filter((file) => file.slice(0, 7) === "account")
    .map((file) => {
      return file.split("-")[1].split(".")[0];
    });
}

export function save(name: string, contract: any, network: string) {
  fs.writeFileSync(
    `${DEPLOYMENTS_DIR}/${network}/${name}.json`,
    JSON.stringify({
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
