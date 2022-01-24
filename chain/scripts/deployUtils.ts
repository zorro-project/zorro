import {ethers, Signer} from 'ethers'
import {getContractAddress} from 'ethers/lib/utils'
import fs from 'fs'
import {ec} from 'starknet'
import {StarknetContract} from 'hardhat/types/runtime'

export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Please provide ${key} as an env var`)
  }

  return value
}

export function getInsecureStarknetPublicKey(accountName: string) {
  console.warn("Insecurely obtaining private key: don't do this on mainnet")
  const privateKey = getRequiredEnv(
    `STARKNET_${accountName.toUpperCase()}_PRIVATE_KEY`
  )
  const keyPair = ec.getKeyPair(privateKey)
  return BigInt(ec.getStarkKey(keyPair))
}

export function getStarknetAddressString(contract: any) {
  return BigInt(contract.address).toString()
}

export function getEthereumAddressAsFelt(ethereumAddress: string) {
  return BigInt(ethereumAddress).toString()
}

export function save(
  path: string,
  network: string,
  name: string,
  address: string,
  constructorArgs: any = []
) {
  fs.writeFileSync(
    `${path}/${name}.json`,
    JSON.stringify({network, address, constructorArgs})
  )
}

export function getSelectorFromName(name: string) {
  const MASK_250 = BigInt(2 ** 250 - 1)
  return (
    BigInt(ethers.utils.keccak256(Buffer.from(name))) % MASK_250
  ).toString()
}

export async function starknetCall(
  caller: StarknetContract,
  contract: StarknetContract,
  functionName: string,
  calldata: any[] | any
) {
  return caller.invoke('execute', {
    to: BigInt(contract.address).toString(),
    selector: getSelectorFromName(functionName),
    calldata: flatten(calldata),
  })
}
function flatten(calldata: any): any[] {
  const res: any = []
  Object.values(calldata).forEach((data: any) => {
    if (typeof data === 'object') {
      res.push(...data)
    } else {
      res.push(data)
    }
  })
  return res
}

// via https://github.com/makerdao/pe-utils/blob/master/packages/hardhat-utils/src/address.ts
/**
 * Get address of the future contract
 * @param signer
 * @param offset - default (0) means next address
 * @returns
 */
export async function getEthereumAddressOfNextDeployedContract(
  signer: Signer,
  offset: number = 0
): Promise<string> {
  return getContractAddress({
    from: await signer.getAddress(),
    nonce: (await signer.getTransactionCount()) + offset,
  })
}

// For kleros arbitration
export async function generateArbitratorExtraData(
  subCourtId: number,
  numVotes: number
) {
  return (
    '0x' +
    subCourtId.toString(16).padStart(64, '0') +
    numVotes.toString(16).padStart(64, '0')
  )
}
