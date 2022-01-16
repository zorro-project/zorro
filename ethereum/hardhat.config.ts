import * as dotenv from 'dotenv'

import {HardhatUserConfig, task, types} from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

dotenv.config()

const mnemonic: string | undefined = process.env.MNEMONIC
if (!mnemonic) {
  throw new Error('Please set your MNEMONIC in a .env file')
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY
if (!infuraApiKey) {
  throw new Error('Please set your INFURA_API_KEY in a .env file')
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task('appeal', 'Appeal a decision by the adjudicator')
  .addParam('address', 'The address of SuperAdjudicator on L1', types.string)
  .addParam(
    'profileId',
    'The zorro profile id to create a dispute around',
    types.int
  )
  .setAction(async (taskArgs, hre) => {
    const {ethers} = hre

    const [signer] = await ethers.getSigners()

    const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
    console.log('Attaching...')
    const superAdjudicator = await SuperAdjudicator.attach(taskArgs.address)

    console.log('Creating dispute...')
    const transactionHash = await signer.sendTransaction({
      to: superAdjudicator.address,
      value: ethers.utils.parseEther('0.03'),
      data: superAdjudicator.interface.encodeFunctionData('appeal', [
        taskArgs.profileId,
      ]),
    })
    console.log('Tx hash', transactionHash)

    // await superAdjudicator.createDispute(1)
  })

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${infuraApiKey}`,
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  /* gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  }, */
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}

export default config
