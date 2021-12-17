export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    photoCID: String!
    videoCID: String!
    address: String!
    hasEmail: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!

    UnaddressedFeedback: NotaryFeedback
  }

  type Query {
    unsubmittedProfiles(pendingReview: Boolean): [UnsubmittedProfile!]!
      @skipAuth
    unsubmittedProfile(address: ID!): UnsubmittedProfile @skipAuth
  }

  input CreateUnsubmittedProfileInput {
    photoCID: String!
    videoCID: String!
    address: String!
  }

  input UpdateUnsubmittedProfileInput {
    photoCID: String
    videoCID: String
  }

  type Mutation {
    updateUnsubmittedProfile(
      address: String!
      input: UpdateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @skipAuth

    unsubmittedProfileSetEmail(
      address: String!
      email: String!
    ): UnsubmittedProfile! @skipAuth

    addNotaryFeedback(id: ID!, feedback: String!): Boolean! @skipAuth
    approveProfile(id: ID!): Boolean! @skipAuth
  }
`
