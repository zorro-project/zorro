// TODO: it may make sense for some of these values to call through to the
// contract and then just cache locally. For ones that depend on the date though
// we probably need to replicate the logic.

// Keep in sync with the relevant getters in `starknet/contracts/zorro.cairo`

export const contractCache = () => ContractCache

const ONE_DAY = 24 * 60 * 60

export const ContractCache = {
  submissionDepositSize: (time = new Date()) => 25,
  challengeDepositSize: (time = new Date()) => 25,
  challengeRewardSize: (time = new Date()) => 25,

  provisionalTimeWindow: 9 * ONE_DAY,
  adjudicationTimeWindow: 6 * ONE_DAY,
  appealTimeWindow: 3 * ONE_DAY,
  superAdjudicationTimeWindow: 30 * ONE_DAY,
}
