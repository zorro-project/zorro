export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    photoCid: String!
    videoCid: String!
    ethereumAddress: String!
    hasEmail: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!

    UnaddressedFeedback: NotaryFeedback
  }

  type Query {
    unsubmittedProfiles(pendingReview: Boolean): [UnsubmittedProfile!]!
      @skipAuth
    unsubmittedProfile(ethereumAddress: ID!): UnsubmittedProfile @skipAuth
  }

  input CreateUnsubmittedProfileInput {
    photoCid: String!
    videoCid: String!
    ethereumAddress: String!
  }

  input UpdateUnsubmittedProfileInput {
    photoCid: String!
    videoCid: String!
  }

  type Mutation {
    updateUnsubmittedProfile(
      ethereumAddress: String!
      input: UpdateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @skipAuth

    unsubmittedProfileSetEmail(
      ethereumAddress: String!
      email: String!
    ): UnsubmittedProfile! @skipAuth

    addNotaryFeedback(id: Int!, feedback: String!): Boolean! @skipAuth
    approveProfile(id: Int!): Boolean! @skipAuth
  }
`
