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
`
