import {
  Abi,
  Contract,
  defaultProvider,
  ec,
  encode,
  hash,
  number,
  stark,
} from 'starknet'
import ERC20_ADDRESS from '../../../../starknet/deployments/goerli/erc20.json'
import NOTARY_ADDRESS from '../../../../starknet/deployments/goerli/notary.json'
import NYM_ADDRESS from '../../../../starknet/deployments/goerli/nym.json'
import NYM_ABI from '../../../../starknet/starknet-artifacts/contracts/nym.cairo/nym_abi.json'
import OZ_ACCOUNT_ABI from '../../../../starknet/starknet-artifacts/contracts/OpenZeppelin/Account.cairo/Account_abi.json'
import assert from 'minimalistic-assert'
import { mapValues } from 'lodash'
import { Prisma } from '@prisma/client'
import { CID } from 'ipfs-http-client'
import { sanitizeHex } from 'starknet/dist/utils/encode'

type Felt = string

export const getNumProfiles = async () => {
  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)
  const response = await nym.call('get_num_profiles', {})
  return parseInt(response.res as string, 16)
}

export async function notarySubmitProfile(
  cid: Felt,
  address: Felt,
  notaryKey: Felt
) {
  const notary = new Contract(OZ_ACCOUNT_ABI as Abi[], NOTARY_ADDRESS.address)

  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)

  const nonce = (await notary.call('get_nonce')).res as string

  const calldata = [cid, address]

  const msgHash = encode.addHexPrefix(
    hash.hashMessage(
      notary.connectedTo,
      NYM_ADDRESS.address,
      stark.getSelectorFromName('submit'),
      calldata,
      nonce
    )
  )

  console.log(cid)

  console.log(msgHash)

  const keypair = ec.getKeyPair(notaryKey)

  const { r, s } = ec.sign(keypair, msgHash)
  console.log('submitting')
  const { code, transaction_hash } = await notary.invoke(
    'execute',
    {
      to: NYM_ADDRESS.address,
      selector: stark.getSelectorFromName('submit'),
      calldata,
      nonce: nonce,
    },
    [number.toHex(r), number.toHex(s)]
  )

  await defaultProvider.waitForTx(transaction_hash)
  console.log('submitted')

  // const depositSize = await nym.call('get_submission_deposit_size', {})
  // const approveTransfer = await notary.invoke('execute', {
  //   to: ERC20_ADDRESS.address,
  //   selector: stark.getSelectorFromName('approve'),
  //   calldata: [NYM_ADDRESS.address, depositSize.res, '0'],
  // })

  // await defaultProvider.waitForTx(approveTransfer.transaction_hash)
  // console.log('submitting')

  // const submission = await notary.invoke('execute', {
  //   to: NYM_ADDRESS.address,
  //   selector: stark.getSelectorFromName('submit'),
  //   calldata: [cid, address],
  // })
  // return await defaultProvider.waitForTx(submission.transaction_hash)
}

type Profile = {
  cid: Felt
  address: Felt
  submitter_address: Felt
  submission_timestamp: Felt
  is_notarized: Felt
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
  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)

  const profile = (await nym.call('export_profile_by_id', {
    profile_id: profileId.toString(16),
  })) as any as {
    profile: Profile
    challenge: Challenge
    num_profiles: string
  }

  return profile
}
