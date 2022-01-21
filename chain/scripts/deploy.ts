// Inspired by https://github.com/makerdao/starknet-dai-bridge/blob/mk/draft/scripts/deploy.ts

import fs from 'fs'
import hre from 'hardhat'
import {expect} from 'chai'
import {isEmpty} from 'lodash'
import {
  getRequiredEnv,
  save,
  getEthereumAddressOfNextDeployedContract,
  getInsecureStarknetPublicKey,
  getStarknetAddressString,
  starknetCall,
} from './deploy-utils'

const CHAIN_DEPLOYMENT = getRequiredEnv('CHAIN_DEPLOYMENT')
const DEV_MODE = !!process.env.DEV_MODE
const NETWORK = hre.network.name
const SAVE_PATH = `./deployments/${CHAIN_DEPLOYMENT}`

const getStaticAddress = (network: string, layer: string, name: string) => {
  const addresses: any = {
    goerli: {
      ethereum: {
        arbitrableProxy: '0x78ac5F189FC6DAB261437a7B95D11cAcf0234FFe',
        superAdjudicatorOwner: '0xEe5fe19b54DDDc740ebEB532B6ADA6F9Cce0512A',
      },
      // via `poetry run starknet --network alpha-goerli get_contract_addresses`
      starknet: {starknetCore: '0xde29d060D45901Fb19ED6C6e959EB22d8626708e'},
    },
    mainnet: {
      ethereum: {arbitrableProxy: null},
      starknet: {starknetCore: null},
    },
  }

  const result = addresses?.[network]?.[layer]?.[name]
  if (!result) {
    throw new Error(
      `Unable to find static address for ${network}/${layer}/${name}`
    )
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
      super_adjudicator_l1_address: 0,
      token_address: getStarknetAddressString(erc20),
    },
    'zorro'
  )

  await Promise.all([transferPromise, transferPromise2, zorroDeployPromise])
  const zorro = await zorroDeployPromise

  const generateArbitratorExtraData = (subcourtId: number, numVotes: number) =>
    '0x' +
    subcourtId.toString(16).padStart(64, '0') +
    numVotes.toString(16).padStart(64, '0')
  const superAdjudicator = await ethereumDeploy('SuperAdjudicator', [
    getStaticAddress(NETWORK, 'starknet', 'starknetCore'), // starnet core
    getStaticAddress(NETWORK, 'ethereum', 'arbitrableProxy'), // arbitrable proxy
    zorro.address, // zorro address
    getStaticAddress(NETWORK, 'ethereum', 'superAdjudicatorOwner'), // owner can update policy
    generateArbitratorExtraData(0, 3), // arbitratorExtraData
    '/ipfs/Qmczs7mGUox91g72kh7RQxVzU9FJWN7RitPiD77WSLnyrg/metaEvidence.json', // metaevidenceURI
    2, // num ruling options
  ])

  // console.log('Creating dispute...')
  // await superAdjudicator.createDispute(1)

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

  /*
  // We get the contract to deploy
  const Greeter = await ethers.getContractFactory('Greeter')
  const greeter = await Greeter.deploy('Hello, Hardhat!')

  await greeter.deployed()

  console.log('Greeter deployed to:', greeter.address)
  */
}

async function ethereumDeploy(
  contractName: string,
  calldata: any = [],
  saveName?: string
) {
  const humanName = `${contractName}${(saveName && '/' + saveName) || ''}`
  console.log(`Deploying: ${humanName}`)
  const contractFactory = await hre.ethers.getContractFactory(contractName)
  const contract = await contractFactory.deploy(...calldata)
  save(SAVE_PATH, NETWORK, saveName || contractName, contract.address)
  console.log(
    `Deployed ${humanName} to: ${contract.address}.`,
    `To verify: yarn hardhat verify ${contract.address} ${calldata
      .filter((a: any) => !isEmpty(a))
      .join(' ')}`
  )
  await contract.deployed()
  return contract
}

async function starknetDeploy(
  contractName: string,
  calldata: any = {},
  saveName?: string
) {
  const humanName = `${contractName}${(saveName && '/' + saveName) || ''}`
  console.log(`Deploying: ${humanName}`)
  const contractFactory = await hre.starknet.getContractFactory(
    'starknet/' + contractName
  )
  const contract = await contractFactory.deploy(calldata)
  save(SAVE_PATH, NETWORK, saveName || contractName, contract.address)
  console.log(
    `Deployed ${humanName} to: ${contract.address}.`,
    `To verify: yarn hardhat starknet-verify --starknet-network ${NETWORK} --path contracts/starknet/${contractName}.cairo --address ${contract.address}`
  )
  return contract
}

// Only use this for Kleros court policy documents (otherwise, we'd be abusing)
// their pinning service).
async function ipfsPublish(fileName, data) {
  const buffer = await Buffer.from(data)

  return new Promise((resolve, reject) => {
    fetch('https://ipfs.kleros.io/add', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        buffer,
      }),
      headers: {
        'content-type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((success) => resolve(success.data))
      .catch((err) => reject(err))
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
