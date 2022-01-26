import {Abi, Contract, defaultProvider, ec, Signer} from 'starknet'
import ERC20_ABI from '../../../../chain/artifacts/contracts/starknet/openzeppelin/ERC20.cairo/ERC20_abi.json'
import ZORRO_ABI from '../../../../chain/artifacts/contracts/starknet/zorro.cairo/zorro_abi.json'

const CHAIN_DEPLOYMENT = process.env.CHAIN_DEPLOYMENT

const maybeRequireContract = (
  chainDeployment: typeof process.env.CHAIN_DEPLOYMENT,
  name: 'erc20' | 'zorro' | 'notary'
) => {
  try {
    return require(`../../../../chain/deployments/${chainDeployment}/${name}.json`)
  } catch (e) {
    return null
  }
}

const chainDeployments = {
  development: {
    erc20: maybeRequireContract('development', 'erc20'),
    notary: maybeRequireContract('development', 'notary'),
    zorro: maybeRequireContract('development', 'zorro'),
  },
  production: {
    erc20: maybeRequireContract('production', 'erc20'),
    notary: maybeRequireContract('production', 'notary'),
    zorro: maybeRequireContract('production', 'zorro'),
  },
  test: {
    erc20: maybeRequireContract('test', 'erc20'),
    notary: maybeRequireContract('test', 'notary'),
    zorro: maybeRequireContract('test', 'zorro'),
  },
}

if (!(CHAIN_DEPLOYMENT in chainDeployments)) {
  throw new Error(`'${CHAIN_DEPLOYMENT}' is not an expected chain deployment'`)
}
const chainDeployment = chainDeployments[CHAIN_DEPLOYMENT]

if (!chainDeployment.zorro) {
  throw new Error(
    `Missing chain deployment '${CHAIN_DEPLOYMENT}'. Try using 'yarn deploy' inside the 'starknet/' dir`
  )
}

export const ERC20Address = chainDeployment.erc20.address
export const NotaryAddress = chainDeployment.notary.address
export const ZorroAddress = chainDeployment.zorro.address

export const zorro = new Contract(ZORRO_ABI as Abi[], ZorroAddress)
export const erc20 = new Contract(ERC20_ABI as Abi[], ERC20Address)

export type Felt = string

export const STARKNET_NOTARY_PRIVATE_KEY =
  process.env.STARKNET_NOTARY_PRIVATE_KEY

export const getNotary = (
  notaryKey: Felt = STARKNET_NOTARY_PRIVATE_KEY ?? ''
) => new Signer(defaultProvider, NotaryAddress, ec.getKeyPair(notaryKey))
