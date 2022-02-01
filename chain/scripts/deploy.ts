// Inspired by https://github.com/makerdao/starknet-dai-bridge/blob/mk/draft/scripts/deploy.ts

import hre, {ethers} from 'hardhat'
import {expect} from 'chai'
import {
  getRequiredEnv,
  save,
  getEthereumAddressOfNextDeployedContract,
  getInsecureStarknetPublicKey,
  getEthereumAddressAsFelt,
  getStarknetAddressString,
  starknetCall,
  generateArbitratorExtraData,
} from './deployUtils'

const CHAIN_DEPLOYMENT = getRequiredEnv('CHAIN_DEPLOYMENT')
const DEV_MODE = !!process.env.DEV_MODE
const NETWORK = hre.network.name
const SAVE_PATH = `./deployments/${CHAIN_DEPLOYMENT}`

const getSetting = (chainDeployment: string, name: string): any => {
  const settings: {[key: string]: {[key: string]: any}} = {
    development: {
      L1ArbitrableProxy: '0x78ac5F189FC6DAB261437a7B95D11cAcf0234FFe', // goerli
      L1SuperAdjudicatorOwner: '0xEe5fe19b54DDDc740ebEB532B6ADA6F9Cce0512A', // goerli
      L1StarknetCore: '0xde29d060D45901Fb19ED6C6e959EB22d8626708e', // goerli
      klerosCourtId: 0, // General court is the only one that exists on goerli
      klerosNumJurorsInFirstRound: 3,
      zorroProfileUrlPrefix: 'http://localhost:8910/profiles/',
      appealBountySize: ethers.utils.parseEther('0.0001'),
    },
    production: {
      klerosCourtId: 23, // Humanity court
      klerosNumJurorsInFirstRound: 1,
      zorroProfileUrlPrefix: 'https://zorro.xyz/profiles/',
      appealBountySize: ethers.utils.parseEther('0.25'),
    },
  }
  settings.staging = {
    ...settings.development,
    zorroProfileUrlPrefix: 'https://testnet.zorro.xyz/profiles/',
  }
  settings.test = settings.development

  const result = settings?.[chainDeployment]?.[name]
  if (result === undefined) {
    throw new Error(`Missing setting for ${chainDeployment}:${name}`)
  }
  return result
}

async function main() {
  await hre.run('compile')
  await hre.run('starknet-compile')

  console.log(
    `Deploying to the '${NETWORK}' network for '${CHAIN_DEPLOYMENT}' (DEV_MODE=${
      DEV_MODE ? 1 : 0
    })`
  )

  const [ethereumSigner] = await hre.ethers.getSigners()
  const futureEthereumSuperAdjudicatorAddress =
    await getEthereumAddressOfNextDeployedContract(ethereumSigner)

  console.log(
    'Future ethereum super adjudictor address',
    futureEthereumSuperAdjudicatorAddress
  )

  const {metaEvidenceURI, numRulingOptions} = await hre.run(
    'deployKlerosMetaEvidence',
    {
      superAdjudicatorAddress: futureEthereumSuperAdjudicatorAddress,
      zorroProfileUrlPrefix: getSetting(
        CHAIN_DEPLOYMENT,
        'zorroProfileUrlPrefix'
      ),
    }
  )

  const [admin, notary, adjudicator, challenger, minter] = await Promise.all([
    starknetDeploy('simple_account', {}, 'admin'),
    starknetDeploy(
      'openzeppelin/Account',
      {_public_key: getInsecureStarknetPublicKey('notary')},
      'notary'
    ),
    starknetDeploy('simple_account', {}, 'adjudicator'),
    starknetDeploy('simple_account', {}, 'challenger'),
    starknetDeploy('simple_account', {}, 'minter'),
  ])

  const erc20 = await starknetDeploy(
    'openzeppelin/ERC20',
    {recipient: getStarknetAddressString(minter)},
    'erc20'
  )

  const transferPromise = starknetCall(minter, erc20, 'transfer', [
    getStarknetAddressString(notary),
    '500',
    '0',
  ])
  const transferPromise2 = starknetCall(minter, erc20, 'transfer', [
    getStarknetAddressString(challenger),
    '100',
    '0',
  ])
  const zorroDeployPromise = starknetDeploy(
    'zorro',
    {
      is_in_dev_mode: DEV_MODE ? 1 : 0,
      admin_address: getStarknetAddressString(admin),
      notary_address: getStarknetAddressString(notary),
      adjudicator_address: getStarknetAddressString(adjudicator),
      super_adjudicator_l1_address: getEthereumAddressAsFelt(
        futureEthereumSuperAdjudicatorAddress
      ),
      token_address: getStarknetAddressString(erc20),
    },
    'zorro'
  )

  await Promise.all([transferPromise, transferPromise2, zorroDeployPromise])
  const zorro = await zorroDeployPromise

  const superAdjudicator = await ethereumDeploy('SuperAdjudicator', [
    getSetting(CHAIN_DEPLOYMENT, 'L1StarknetCore'),
    getSetting(CHAIN_DEPLOYMENT, 'L1ArbitrableProxy'),
    zorro.address,
    getSetting(CHAIN_DEPLOYMENT, 'L1SuperAdjudicatorOwner'),
    getSetting(CHAIN_DEPLOYMENT, 'appealBountySize'),
    generateArbitratorExtraData(
      getSetting(CHAIN_DEPLOYMENT, 'klerosCourtId'),
      getSetting(CHAIN_DEPLOYMENT, 'klerosNumJurorsInFirstRound')
    ),
    metaEvidenceURI,
    numRulingOptions,
  ])

  expect(
    futureEthereumSuperAdjudicatorAddress === superAdjudicator.address,
    'futureEthereumSuperAdjudicatorAddress != superAdjudicator.address'
  )

  if (DEV_MODE) {
    console.log('Sending money to the Zorro contract')
    // If we're doing a test deployment, give some money to the Zorro contract
    // so that it can afford `settle`ments associated with test seeded contracts
    const p1 = starknetCall(minter, erc20, 'transfer', [
      getStarknetAddressString(zorro),
      '300',
      '0',
    ])

    console.log('Seeding contract with fake profiles')
    const p2 = starknetCall(admin, zorro, '_dev_add_seed_profiles', [])

    await Promise.all([p1, p2])
  }
}

async function ethereumDeploy(
  contractName: string,
  constructorArgs: any = [],
  saveName?: string
) {
  const humanName = `${contractName}${(saveName && '/' + saveName) || ''}`
  console.log(`Deploying to ethereum: ${humanName}`)
  const contractFactory = await hre.ethers.getContractFactory(contractName)
  const contract = await contractFactory.deploy(...constructorArgs)

  const verificationCommand = `yarn hardhat verify ${
    contract.address
  } ${constructorArgs.join(' ')} --network ${NETWORK}`
  save(
    SAVE_PATH,
    NETWORK,
    saveName || contractName,
    contract.address,
    constructorArgs,
    verificationCommand
  )
  console.log(`Deployed ${humanName} to ethereum: ${contract.address}.`)
  console.log('Verification command:', verificationCommand)
  await contract.deployed()
  return contract
}

async function starknetDeploy(
  contractName: string,
  constructorArgs: any = {},
  saveName?: string
) {
  const humanName = `${contractName}${(saveName && '/' + saveName) || ''}`
  console.log(`Deploying to starknet: ${humanName}`)
  const contractFactory = await hre.starknet.getContractFactory(
    'starknet/' + contractName
  )
  const contract = await contractFactory.deploy(constructorArgs)

  const verificationCommand = `yarn hardhat starknet-verify --starknet-network ${NETWORK} --path contracts/starknet/${contractName}.cairo --address ${contract.address}`
  save(
    SAVE_PATH,
    NETWORK,
    saveName || contractName,
    contract.address,
    constructorArgs,
    verificationCommand
  )
  console.log(`Deployed ${humanName} to starknet: ${contract.address}.`)
  console.log('Verification command:', verificationCommand)
  return contract
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
