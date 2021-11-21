import { Abi, Contract, defaultProvider, stark } from 'starknet'
import ERC20_ADDRESS from '../../../../starknet/deployments/goerli/erc20.json'
import NOTARY_ADDRESS from '../../../../starknet/deployments/goerli/notary.json'
import NYM_ADDRESS from '../../../../starknet/deployments/goerli/nym.json'
import NYM_ABI from '../../../../starknet/starknet-artifacts/contracts/nym.cairo/nym_abi.json'
import SIMPLE_ACCOUNT_ABI from '../../../../starknet/starknet-artifacts/contracts/simple_account.cairo/simple_account_abi.json'
import assert from 'minimalistic-assert'

type Felt = string

export const bytesToFelt = (bytes: Uint8Array) => {
  assert(bytes.length <= 31, 'Error: CIDs on Cairo must be 31 bytes')

  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

export const getNumProfiles = async () => {
  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)
  const response = await nym.call('get_num_profiles', {})
  return response
  console.log('Response', response)
}

export async function notarySubmitProfile(cid: Felt, address: Felt) {
  const notary = new Contract(
    SIMPLE_ACCOUNT_ABI as Abi[],
    NOTARY_ADDRESS.address
  )

  console.log({ cid, address })

  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)

  // const depositSize = await nym.call('get_submission_deposit_size', {})

  // const approveTransfer = await notary.invoke('execute', {
  //   to: ERC20_ADDRESS.address,
  //   selector: stark.getSelectorFromName('approve'),
  //   calldata: [NYM_ADDRESS.address, depositSize.res, '0'],
  // })

  // await defaultProvider.waitForTx(approveTransfer.transaction_hash)
  // console.log('submitting')

  const submission = await notary.invoke('execute', {
    to: NYM_ADDRESS.address,
    selector: stark.getSelectorFromName('submit'),
    calldata: [cid, address],
  })
  return await defaultProvider.waitForTx(submission.transaction_hash)
}

export async function exportProfileById(profileId: Felt) {
  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)

  const profile = await nym.call('export_profile_by_id', {
    profile_id: profileId,
  })

  return profile
}
