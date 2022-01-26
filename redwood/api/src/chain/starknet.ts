import {defaultProvider, number, SignerInterface, stark} from 'starknet'
import {BigNumberish} from 'starknet/dist/utils/number'
import {bnToUint256, Uint256, uint256ToBN} from 'starknet/dist/utils/uint256'
import {
  erc20,
  ERC20Address,
  Felt,
  getNotary,
  zorro,
  ZorroAddress,
} from './contracts'

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
    calldata: [spender, uintAmount.low.toString(), uintAmount.high.toString()],
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
    calldata: [owner, uintAmount.low.toString(), uintAmount.high.toString()],
  })

  return defaultProvider.waitForTx(resp.transaction_hash)
}

export async function notarySubmitProfile(
  cid: Felt,
  ethereumAddress: Felt,
  notaryKey: Felt
) {
  const notary = getNotary(notaryKey)

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
  did_super_adjudicator_overturn_adjudicator: Felt
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
