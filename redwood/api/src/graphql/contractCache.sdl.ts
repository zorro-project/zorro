export const schema = gql`
  type ContractCache {
    submissionDepositSize(time: Date): Int!
    challengeDepositSize(time: Date): Int!
    challengeRewardSize(time: Date): Int!
    provisionalPeriod: Int!
    adjudicationPeriod: Int!
    appealPeriod: Int!
    superAdjudicationPeriod: Int!
  }

  type Query {
    contractCache: ContractCache! @skipAuth
  }
`
