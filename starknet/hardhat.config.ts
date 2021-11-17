import "@shardlabs/starknet-hardhat-plugin";

module.exports = {
  solidity: "0.8.4",
  cairo: {
    version: "0.5.2",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    starknetSources: "./contracts",
    starknetArtifacts: "./starknet-artifacts",
  },
  networks: {
    localnet: {
      url: "http://localhost:5000",
    },
  },
  mocha: {
    // Used for deployment in Mocha tests
    // Defaults to "alpha", which is preconfigured even if you don't see it under `networks:`
    starknetNetwork: "localnet",
  },
};
