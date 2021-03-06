// Functions we want to expose to the client

export {cairoCompatibleAdd} from '../../../api/src/lib/ipfs'
export {serializeCid} from '../../../api/src/chain/serializers'

export type {ApiProcessEnv} from '../../../api/types/environment'
export type {ClientCurrentUser} from '../../../api/src/lib/auth'

export {
  erc20Approve,
  getChallengeDepositSize,
  submitChallenge,
  erc20GetAllowance,
  erc20GetBalanceOf,
  erc20Mint,
  exportProfileById,
  getNumProfiles,
  notarySubmitProfile,
} from '../../../api/src/chain/starknet'

export {
  ZorroAddress,
  ERC20Address,
  NotaryAddress,
} from '../../../api/src/chain/contracts'
