import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@shardlabs/starknet-hardhat-plugin";
//import "./scripts/interact";
//import "./scripts/account";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { resolve } from "path";

const chainIds = {
  goerli: 5,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = `https://${network}.infura.io/v3/${infuraApiKey}`;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: getChainConfig("goerli"),
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    starknetSources: "./contracts",
    starknetArtifacts: "./starknet-artifacts",
  },
  cairo: {
    venv: "./.venv",
  },
};

export default config;
