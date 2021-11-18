// Ganked from https://github.com/makerdao/starknet-dai-bridge/blob/mk/draft/scripts/deploy.ts

//import { getAddressOfNextDeployedContract } from "@makerdao/hardhat-utils";
import fs from "fs";
import hre from "hardhat";

import { callFrom, getAddress, save } from "./utils";

//const L1_GOERLI_DAI_ADDRESS = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
//const L1_GOERLI_STARKNET_ADDRESS = "0x5e6229F2D4d977d20A50219E521dE6Dd694d45cc";

function getAddressString(contract: any) {
  return BigInt(contract.address).toString();
}

let NETWORK: string;

async function main(): Promise<void> {
  const [signer] = await hre.ethers.getSigners();
  if (signer.provider) {
    const network = await signer.provider.getNetwork();
    NETWORK = network.name;
  }
  console.log(`Deploying on ${NETWORK}`);

  if (!fs.existsSync(`./deployments/${NETWORK}`)) {
    fs.mkdirSync(`./deployments/${NETWORK}`, { recursive: true });
  }

  const [mirror, admin, notary, adjudicator, challenger, minter] =
    await Promise.all([
      deploy(hre, "mirror", 2, {}, "mirror"),
      deploy(hre, "simple_account", 2, {}, "admin"),
      deploy(hre, "simple_account", 2, {}, "notary"),
      deploy(hre, "simple_account", 2, {}, "adjudicator"),
      deploy(hre, "simple_account", 2, {}, "challenger"),
      deploy(hre, "simple_account", 2, {}, "minter"),
    ]);

  const erc20 = await deploy(
    hre,
    "ERC20",
    2,
    { recipient: getAddressString(minter) },
    "erc20"
  );

  console.log("Transferring some funds to the notary");
  await callFrom(erc20, "transfer", [getAddressString(notary), 500, 0], minter);

  console.log("Transferring some funds to the challenger");
  await callFrom(
    erc20,
    "transfer",
    [getAddressString(challenger), 100, 0],
    minter
  );

  const nym = await deploy(
    hre,
    "nym",
    2,
    {
      admin_address: getAddressString(admin),
      notary_address: getAddressString(notary),
      adjudicator_address: getAddressString(adjudicator),
      super_adjudicator_l1_address: 0,
      token_address: getAddressString(erc20),
      mirror_address: getAddressString(mirror),
    },
    "nym"
  );
}

async function deploy(
  hre: any,
  contractName: string,
  layer: 1 | 2,
  calldata: any,
  saveName?: string
) {
  const network = layer === 1 ? "ethers" : "starknet";
  console.log(`Deploying ${contractName}`);
  const contractFactory = await hre[network].getContractFactory(contractName);
  let contract;
  if (layer === 1) {
    contract = await contractFactory.deploy(...calldata);
  } else {
    contract = await contractFactory.deploy(calldata);
  }
  const fileName = saveName || contractName;
  save(fileName, contract, NETWORK);
  if (layer === 1) {
    await contract.deployed();
  }
  return contract;
}

main()
  .then(() => console.log("Successfully deployed"))
  .catch((err) => console.log(err));
