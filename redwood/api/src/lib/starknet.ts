import {
  Abi,
  Contract,
  defaultProvider,
  ec,
  number,
  Signer,
  SignerInterface,
  stark,
} from 'starknet'
import {BigNumberish} from 'starknet/dist/utils/number'
import {bnToUint256, Uint256, uint256ToBN} from 'starknet/dist/utils/uint256'
import ERC20_ABI from '../../../../starknet/starknet-artifacts/contracts/openzeppelin/ERC20.cairo/ERC20_abi.json'
import ZORRO_ABI from '../../../../starknet/starknet-artifacts/contracts/zorro.cairo/zorro_abi.json'

const CHAIN_DEPLOYMENT = process.env.CHAIN_DEPLOYMENT

type AvailableContract = 'erc20' | 'zorro' | 'notary'

const maybeRequireContract = (
  chainDeployment: typeof process.env.CHAIN_DEPLOYMENT,
  name: AvailableContract
) => {
  try {
    return require(`../../../../starknet/chain-deployments/${chainDeployment}/${name}.json`)
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

type Felt = string

export const ERC20Address = chainDeployment.erc20.address
export const NotaryAddress = chainDeployment.notary.address
export const ZorroAddress = chainDeployment.zorro.address
const zorro = new Contract(ZORRO_ABI as Abi[], ZorroAddress)
const erc20 = new Contract(ERC20_ABI as Abi[], ERC20Address)

export const getNumProfiles = async () => {
  const response = await zorro.call('get_num_profiles', {})
  return parseInt(response.res as string, 16)
}

export async function getSubmissionDepositSize(timestamp = new Date()) {
  const response = await zorro.call('get_submission_deposit_size', {
    timestamp: number.toHex(number.toBN(timestamp.getTime() / 1000)),
  })
  return parseInt(response.res as string, 16)
}

export async function getChallengeDepositSize(timestamp = new Date()) {
  const response = await zorro.call('get_challenge_deposit_size', {
    timestamp: number.toHex(number.toBN(timestamp.getTime() / 1000)),
  })
  return parseInt(response.res as string, 16)
}

export async function erc20Approve(
  owner: SignerInterface,
  spender: Felt,
  amount: BigNumberish
) {
  const uintAmount = bnToUint256(amount)
  const resp = await owner.addTransaction({
    type: 'INVOKE_FUNCTION',
    contract_address: ERC20Address,
    entry_point_selector: stark.getSelectorFromName('approve'),
    calldata: [spender, uintAmount.low, uintAmount.high],
  })

  return defaultProvider.waitForTx(resp.transaction_hash)
}

export async function erc20GetAllowance(owner: Felt, spender: Felt) {
  const resp = await erc20.call('allowance', {
    owner,
    spender,
  })

  return uint256ToBN(resp.res as unknown as Uint256)
}

export async function erc20GetBalanceOf(owner: Felt) {
  const resp = await erc20.call('balance_of', {
    owner,
  })

  return uint256ToBN(resp.res as unknown as Uint256)
}

export async function erc20Mint(
  signer: SignerInterface,
  owner: Felt,
  amount: BigNumberish
) {
  const uintAmount = bnToUint256(amount)

  const resp = await signer.addTransaction({
    type: 'INVOKE_FUNCTION',
    contract_address: ERC20Address,
    entry_point_selector: stark.getSelectorFromName('mint'),
    calldata: [owner, uintAmount.low, uintAmount.high],
  })

  return defaultProvider.waitForTx(resp.transaction_hash)
}

export async function notarySubmitProfile(
  cid: Felt,
  ethereumAddress: Felt,
  notaryKey: Felt
) {
  const notary = new Signer(
    defaultProvider,
    NotaryAddress,
    ec.getKeyPair(notaryKey)
  )

  const depositSize = await getSubmissionDepositSize()
  console.log({depositSize})

  console.log('attempting erc20 approve')
  await erc20Approve(notary, ZorroAddress, depositSize)
  console.log('erc20 approved')

  console.log('attempting zorro submit')
  const resp = await notary.addTransaction({
    type: 'INVOKE_FUNCTION',
    contract_address: ZorroAddress,
    entry_point_selector: stark.getSelectorFromName('submit'),
    calldata: [cid, ethereumAddress],
  })
  console.log('zorro submit tx hash', resp.transaction_hash)
  return defaultProvider.waitForTx(resp.transaction_hash)
}

export async function submitChallenge(
  challenger: SignerInterface,
  profileId: Felt,
  evidenceCid: Felt
) {
  const resp = await challenger.addTransaction({
    type: 'INVOKE_FUNCTION',
    contract_address: ZorroAddress,
    entry_point_selector: stark.getSelectorFromName('challenge'),
    calldata: [profileId, evidenceCid],
  })
  return defaultProvider.waitForTx(resp.transaction_hash)
}

// Keep in sync with profile.cairo
type Profile = {
  cid: Felt
  ethereum_address: Felt
  submitter_address: Felt
  submission_timestamp: Felt
  is_notarized: Felt
  last_recorded_status: Felt
  challenge_timestamp: Felt
  challenger_address: Felt
  challenge_evidence_cid: Felt
  owner_evidence_cid: Felt
  adjudication_timestamp: Felt
  adjudicator_evidence_cid: Felt
  did_adjudicator_verify_profile: Felt
  appeal_timestamp: Felt
  appeal_id: Felt
  super_adjudication_timestamp: Felt
  did_super_adjudicator_verify_profile: Felt
}

export async function exportProfileById(profileId: number) {
  try {
    const profile = (await zorro.call('export_profile_by_id', {
      profile_id: profileId.toString(),
    })) as unknown as {
      profile: Profile
      num_profiles: Felt
      current_status: Felt
      is_verified: Felt
      now: Felt
    }
    return profile
  } catch (e) {
    return null
  }
}
