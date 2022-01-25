import 'dotenv-defaults/config'

import '@shardlabs/starknet-hardhat-plugin'
import {HardhatUserConfig, task} from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import './tasks'

const mnemonicPartOne: string | undefined = process.env.MNEMONIC_PART_ONE
const mnemonicPartTwo: string | undefined = process.env.MNEMONIC_PART_TWO
if (!mnemonicPartOne || !mnemonicPartTwo) {
  throw new Error(
    'Please set MNEMONIC_PART_ONE and MNEMONIC_PART_TWO in a .env file'
  )
}

const mnemonic = `${mnemonicPartOne} ${mnemonicPartTwo}`

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY
if (!infuraApiKey) {
  throw new Error('Please set your INFURA_API_KEY in a .env file')
}

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${infuraApiKey}`,
      accounts: {
        count: 4,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './.hardhat-cache',
    sources: './contracts/ethereum',
    tests: './test',
    starknetSources: './contracts/starknet',
    starknetArtifacts: './artifacts',
  },
  /* gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  }, */
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  cairo: {
    venv: './.venv',
  },
}

export default config