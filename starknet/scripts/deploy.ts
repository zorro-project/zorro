// Ganked from https://github.com/makerdao/starknet-dai-bridge/blob/mk/draft/scripts/deploy.ts

import fs from "fs";
import hre from "hardhat";
import { ec } from "starknet";
import { callFrom, getAddress, save, getRequiredEnv } from "./utils";

//const L1_GOERLI_DAI_ADDRESS = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
//const L1_GOERLI_STARKNET_ADDRESS = "0x5e6229F2D4d977d20A50219E521dE6Dd694d45cc";

function getPublicKey(accountName: string) {
  console.warn("Insecurely obtaining private key: don't do this on mainnet");
  const privateKey = getRequiredEnv(
    `STARKNET_${accountName.toUpperCase()}_PRIVATE_KEY`
  );
  const keyPair = ec.getKeyPair(privateKey);
  return BigInt(ec.getStarkKey(keyPair));
}

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

  const [admin, notary, adjudicator, challenger, minter] = await Promise.all([
    deployL2("simple_account", {}, "admin"),
    deployL2("Account", { _public_key: getPublicKey("notary") }, "notary"),
    deployL2("simple_account", {}, "adjudicator"),
    deployL2("simple_account", {}, "challenger"),
    deployL2("simple_account", {}, "minter"),
  ]);

  const erc20 = await deployL2(
    "ERC20",
    { recipient: getAddressString(minter) },
    "erc20"
  );

  const transferPromise = callFrom(
    erc20,
    "transfer",
    [getAddressString(notary), "500", "0"],
    minter
  );
  const transferPromise2 = callFrom(
    erc20,
    "transfer",
    [getAddressString(challenger), "100", "0"],
    minter
  );
  const nymDeployPromise = deployL2(
    "nym",
    {
      admin_address: getAddressString(admin),
      notary_address: getAddressString(notary),
      adjudicator_address: getAddressString(adjudicator),
      super_adjudicator_l1_address: 0,
      token_address: getAddressString(erc20),
    },
    "nym"
  );

  await Promise.all([transferPromise, transferPromise2, nymDeployPromise]);
}

async function deployL2(name: string, calldata: any = {}, saveName?: string) {
  console.log(`Deploying: ${name}${(saveName && "/" + saveName) || ""}...`);
  const contractFactory = await hre.starknet.getContractFactory(name);
  const contract = await contractFactory.deploy(calldata);
  save(saveName || name, contract, hre.network.name);
  return contract;
}

async function deployL1(name: string, calldata: any = [], saveName?: string) {
  console.log(`Deploying: ${name}${(saveName && "/" + saveName) || ""}`);
  const contractFactory = await hre.ethers.getContractFactory(name);
  const contract = await contractFactory.deploy(...calldata);
  save(saveName || name, contract, hre.network.name);
  await contract.deployed();
  return contract;
}

main()
  .then(() => console.log("Successfully deployed"))
  .catch((err) => console.log(err));
