// Ganked from https://github.com/makerdao/starknet-dai-bridge/blob/mk/draft/scripts/deploy.ts

import fs from "fs";
import hre from "hardhat";
import { ec } from "starknet";
import { callFrom, save, getRequiredEnv, CHAIN_DEPLOYMENTS_DIR } from "./utils";

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

const CHAIN_DEPLOYMENT = getRequiredEnv("CHAIN_DEPLOYMENT"); // e.g. development, staging, production
const DEV_MODE = !!process.env.DEV_MODE;
let NETWORK: string;

async function main(): Promise<void> {
  const [signer] = await hre.ethers.getSigners();
  if (signer.provider) {
    const network = await signer.provider.getNetwork();
    NETWORK = network.name;
  }
  console.log(
    `Deploying to '${CHAIN_DEPLOYMENT}' on the '${NETWORK}' network (DEV_MODE=${
      DEV_MODE ? 1 : 0
    })`
  );

  if (!fs.existsSync(`${CHAIN_DEPLOYMENTS_DIR}/${CHAIN_DEPLOYMENT}`)) {
    fs.mkdirSync(`${CHAIN_DEPLOYMENTS_DIR}/${CHAIN_DEPLOYMENT}`, {
      recursive: true,
    });
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
  const zorroDeployPromise = deployL2(
    "zorro",
    {
      is_in_dev_mode: DEV_MODE ? 1 : 0,
      admin_address: getAddressString(admin),
      notary_address: getAddressString(notary),
      adjudicator_address: getAddressString(adjudicator),
      super_adjudicator_l1_address: 0,
      token_address: getAddressString(erc20),
    },
    "zorro"
  );

  await Promise.all([transferPromise, transferPromise2, zorroDeployPromise]);

  if (DEV_MODE) {
    console.log("Sending money to the Zorro contract");
    // If we're doing a test deployment, give some money to the Zorro contract
    // so that it can afford `settle`ments associated with test seeded contracts
    const zorro = await zorroDeployPromise;
    const p1 = callFrom(
      erc20,
      "transfer",
      [getAddressString(zorro), "300", "0"],
      minter
    );

    console.log("Seeding contract with fake profiles");
    const p2 = callFrom(zorro, "_dev_add_seed_profiles", [], admin);

    await Promise.all([p1, p2]);
  }
}

async function deployL2(name: string, calldata: any = {}, saveName?: string) {
  console.log(`Deploying: ${name}${(saveName && "/" + saveName) || ""}...`);
  const contractFactory = await hre.starknet.getContractFactory(name);
  const contract = await contractFactory.deploy(calldata);
  save(saveName || name, contract, hre.network.name, CHAIN_DEPLOYMENT);
  return contract;
}

async function deployL1(name: string, calldata: any = [], saveName?: string) {
  console.log(`Deploying: ${name}${(saveName && "/" + saveName) || ""}`);
  const contractFactory = await hre.ethers.getContractFactory(name);
  const contract = await contractFactory.deploy(...calldata);
  save(saveName || name, contract, hre.network.name, CHAIN_DEPLOYMENT);
  await contract.deployed();
  return contract;
}

main()
  .then(() => console.log("Successfully deployed"))
  .catch((err) => console.log(err));
