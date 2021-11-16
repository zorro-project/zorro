require("@shardlabs/starknet-hardhat-plugin");

module.exports = {
  solidity: "0.8.4",
  cairo: {
    version: "0.5.2",
  },
  networks: {
    localnet: {
      url: "http://starknet-devnet:5000",
    },
  },
  mocha: {
    // Used for deployment in Mocha tests
    // Defaults to "alpha", which is preconfigured even if you don't see it under `networks:`
    starknetNetwork: "localnet",
  },
};
