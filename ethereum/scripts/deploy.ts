import {ethers} from 'hardhat'

async function main() {
  const SuperAdjudicator = await ethers.getContractFactory('SuperAdjudicator')
  // const greeter = await Greeter.deploy("Hello, Hardhat!");
  // await greeter.deployed();
  // console.log("Greeter deployed to:", greeter.address);
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
