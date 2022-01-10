export const schema = gql`
  type ContractCache {
    submissionDepositSize(time: Date): Int!
    challengeDepositSize(time: Date): Int!
    challengeRewardSize(time: Date): Int!
    provisionalTimeWindow: Int!
    adjudicationTimeWindow: Int!
    appealTimeWindow: Int!
    superAdjudicationTimeWindow: Int!
  }

  type Query {
    contractCache: ContractCache! @skipAuth
  }
`
