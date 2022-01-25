import {task, types} from 'hardhat/config'
import deployKlerosMetaEvidence from './klerosMetaEvidence/deploy'

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// for example:
// yarn hardhat appeal --super-adjudicator-address 0x6ED75F4b105B7dF134C12794663Eb847ac8FdC0b --profile-id 11 --network goerli
task('appeal', 'Appeal a decision by the adjudicator')
  .addParam(
    'superAdjudicatorAddress',
    'The address of SuperAdjudicator on L1',
    undefined,
    types.string
  )
  .addParam(
    'profileId',
    'The zorro profile id to create a dispute around',
    undefined,
    types.int
  )
  .setAction(async (taskArgs, hre) => {
    const {ethers} = hre

    const [signer] = await ethers.getSigners()

    const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
    console.log('Attaching...')
    const superAdjudicator = await SuperAdjudicator.attach(
      taskArgs.superAdjudicatorAddress
    )

    console.log('Creating dispute...')
    // XXX: look up the court fee dynamically? or take it as a command line arg?
    const result = await signer.sendTransaction({
      to: superAdjudicator.address,
      value: ethers.utils.parseEther('0.03'), // court fee... may be different on L1?
      data: superAdjudicator.interface.encodeFunctionData('appeal', [
        taskArgs.profileId,
      ]),
    })
    console.log('tx', result)
  })

// for example:
// yarn hardhat enactRuling --super-adjudicator-address 0x09e5b8334bd71Dd50869F7F02C2e02E3c3a3627c --dispute-id 7 --network goerli
task('enactRuling', 'Enact a decision resolved by the court')
  .addParam(
    'superAdjudicatorAddress',
    'The address of SuperAdjudicator on L1',
    undefined,
    types.string
  )
  .addParam('disputeId', 'The arbitrator dispute id', undefined, types.int)
  .setAction(async (taskArgs, hre) => {
    const {ethers} = hre

    const [signer] = await ethers.getSigners()

    const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
    console.log('Attaching...')
    const superAdjudicator = await SuperAdjudicator.attach(
      taskArgs.superAdjudicatorAddress
    )

    console.log('Enacting ruling...')
    const result = await superAdjudicator.enactRuling(taskArgs.disputeId)
    console.log('tx', result)
  })

task('deployKlerosMetaEvidence')
  .addParam(
    'superAdjudicatorAddress',
    'The address of the SuperAdjudicator on L1',
    undefined,
    types.string
  )
  .addParam(
    'zorroProfileUrlPrefix',
    "Url to which `profileId` can be appended, e.g. 'https://zorroy.xyz/profiles/'",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    const {metaEvidenceURI, numRulingOptions} = await deployKlerosMetaEvidence(
      taskArgs.superAdjudicatorAddress,
      taskArgs.zorroProfileUrlPrefix
    )
    return {metaEvidenceURI, numRulingOptions}
  })
