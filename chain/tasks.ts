import {task, types} from 'hardhat/config'

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
