import {ethers} from 'hardhat'

import {save} from '../utils'

const goerliArbitrableProxyAddress =
  '0x78ac5F189FC6DAB261437a7B95D11cAcf0234FFe'

const generateArbitratorExtraData = (subcourtId: number, numVotes: number) =>
  '0x' +
  subcourtId.toString(16).padStart(64, '0') +
  numVotes.toString(16).padStart(64, '0')

let NETWORK: string
async function main() {
  const [signer] = await ethers.getSigners()
  if (signer.provider) {
    const network = await signer.provider.getNetwork()
    NETWORK = network.name
  }

  const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
  const superAdjudicator = await SuperAdjudicator.deploy(
    '0x0000000000000000000000000000000000000000', // starknet core
    goerliArbitrableProxyAddress,
    '0x0000000000000000000000000000000000000000', // zorro address
    '0xEe5fe19b54DDDc740ebEB532B6ADA6F9Cce0512A', // owner
    generateArbitratorExtraData(0, 3), // arbitratorExtraData
    '/ipfs/Qmczs7mGUox91g72kh7RQxVzU9FJWN7RitPiD77WSLnyrg/metaEvidence.json', // metaevidenceURI
    2 // num ruling options
  )

  save('SuperAdjudicator', superAdjudicator, NETWORK, 'development')

  console.log('Super adjudicator deployed to', superAdjudicator.address)

  console.log('Creating dispute...')
  await superAdjudicator.createDispute(1)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
