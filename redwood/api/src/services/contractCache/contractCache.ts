// TODO: it may make sense for some of these values to call through to the
// contract and then just cache locally. For ones that depend on the date though
// we probably need to replicate the logic.

// Keep in sync with the relevant getters in `starknet/contracts/zorro.cairo`

export const contractCache = () => ContractCache

// The number of milliseconds in a day
const ONE_DAY = 24 * 60 * 60 * 1000

export const ContractCache = {
  submissionDepositSize: (_time = new Date()) => 25,
  challengeDepositSize: (_time = new Date()) => 25,
  challengeRewardSize: (_time = new Date()) => 25,

  // Note that all of these are 1000x the actual values listed in the contract
  // to make date math on the JS side easier, since JS dates are in
  // milliseconds.
  provisionalTimeWindow: 9 * ONE_DAY,
  adjudicationTimeWindow: 6 * ONE_DAY,
  appealTimeWindow: 3 * ONE_DAY,
  superAdjudicationTimeWindow: 30 * ONE_DAY,
}
