export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    photoCID: String!
    videoCID: String!
    ethAddress: String!
    hasEmail: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!

    UnaddressedFeedback: NotaryFeedback
  }

  type Query {
    unsubmittedProfiles(pendingReview: Boolean): [UnsubmittedProfile!]!
      @skipAuth
    unsubmittedProfile(ethAddress: String!): UnsubmittedProfile @skipAuth
  }

  input CreateUnsubmittedProfileInput {
    photoCID: String!
    videoCID: String!
    ethAddress: String!
  }

  input UpdateUnsubmittedProfileInput {
    photoCID: String
    videoCID: String
  }

  type Mutation {
    updateUnsubmittedProfile(
      ethAddress: String!
      input: UpdateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @skipAuth

    unsubmittedProfileSetEmail(
      ethAddress: String!
      email: String!
    ): UnsubmittedProfile! @skipAuth

    addNotaryFeedback(profileId: Int!, feedback: String!): Boolean! @skipAuth
    approveProfile(profileId: Int!): Boolean! @skipAuth
  }
`
