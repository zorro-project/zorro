import {Prisma} from '@prisma/client'
import {
  Abi,
  Contract,
  defaultProvider,
  ec,
  number,
  Signer,
  stark,
} from 'starknet'
import {BigNumberish} from 'starknet/dist/utils/number'
import {bnToUint256, uint256ToBN} from 'starknet/dist/utils/uint256'

import ERC20_ABI from '../../../../starknet/starknet-artifacts/contracts/openzeppelin/ERC20.cairo/ERC20_abi.json'
import ZORRO_ABI from '../../../../starknet/starknet-artifacts/contracts/zorro.cairo/zorro_abi.json'

const chainDeployments = {
  development: {
    erc20:
      require('../../../../starknet/chain-deployments/development/erc20.json')
        .address,
    notary:
      require('../../../../starknet/chain-deployments/development/notary.json')
        .address,
    zorro:
      require('../../../../starknet/chain-deployments/development/zorro.json')
        .address,
  },
  production: {
    erc20:
      require('../../../../starknet/chain-deployments/production/erc20.json')
        .address,
    notary:
      require('../../../../starknet/chain-deployments/production/notary.json')
        .address,
    zorro:
      require('../../../../starknet/chain-deployments/production/zorro.json')
        .address,
  },
}

const CHAIN_DEPLOYMENT = process.env.CHAIN_DEPLOYMENT
if (!(CHAIN_DEPLOYMENT in chainDeployments)) {
  throw new Error(`Missing on-chain deployment ${CHAIN_DEPLOYMENT}`)
}
const addresses = chainDeployments[CHAIN_DEPLOYMENT]

type Felt = string

export const ERC20Address = addresses.erc20
export const NotaryAddress = addresses.notary
export const ZorroAddress = addresses.zorro
const zorro = new Contract(ZORRO_ABI as Abi[], ZorroAddress)

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

export async function erc20Approve(
  owner: Signer,
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
  console.log('erc20 approve tx hash', resp.transaction_hash)
  return defaultProvider.waitForTx(resp.transaction_hash)
}

export async function getAllowance(owner: Felt, spender: Felt) {
  const erc20 = new Contract(ERC20_ABI as Abi[], ERC20Address)
  const resp = await erc20.call('allowance', {
    owner,
    spender,
  })

  return uint256ToBN(resp.res as any)
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
  super_adjudication_timestamp: Felt
  did_super_adjudicator_verify_profile: Felt
}

type Challenge = {
  last_recorded_status: Felt
  challenge_timestamp: Felt
  challenger_address: Felt
  challenge_evidence_cid: Felt
  profile_owner_evidence_cid: Felt
  adjudication_timestamp: Felt
  adjudicator_evidence_cid: Felt
  did_adjudicator_confirm_profile: Felt
  appeal_timestamp: Felt
  super_adjudication_timestamp: Felt
  did_super_adjudicator_confirm_prof: Felt
}

export async function exportProfileById(
  profileId: bigint | number | string | Prisma.Decimal
) {
  const profile = (await zorro.call('export_profile_by_id', {
    profile_id: profileId.toString(16),
  })) as any as {
    profile: Profile
    num_profiles: Felt
    status: Felt
    is_verified: Felt
  }

  return profile
}
