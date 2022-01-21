import {expect} from 'chai'
import {ethers} from 'hardhat'

describe('SuperAdjudicator', function () {
  it('Can be constructed', async function () {
    const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
    const superAdjudicator = await SuperAdjudicator.deploy(
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000'
    )
    await superAdjudicator.deployed()
    // expect(await greeter.greet()).to.equal('Hello, world!')

    // const setGreetingTx = await greeter.setGreeting('Hola, mundo!')

    // wait until the transaction is mined
    // await setGreetingTx.wait()

    // expect(await greeter.greet()).to.equal('Hola, mundo!')
  })
})
