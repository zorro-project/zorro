export const schema = gql`
  type NotaryFeedback {
    id: Int!
    unsubmittedProfileId: Int!
    feedback: String!
    UnsubmittedProfile: UnsubmittedProfile!
    isUnaddressed: [UnsubmittedProfile]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    notaryFeedbacks: [NotaryFeedback!]! @requireAuth
  }

  input CreateNotaryFeedbackInput {
    unsubmittedProfileId: Int!
    feedback: String!
  }

  input UpdateNotaryFeedbackInput {
    unsubmittedProfileId: Int
    feedback: String
  }
`
