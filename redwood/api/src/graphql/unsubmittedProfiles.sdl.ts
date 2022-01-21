export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    photoCid: String!
    videoCid: String!
    ethereumAddress: String!

    lastSubmittedAt: DateTime!
    notaryViewedAt: DateTime
    notaryApprovedAt: DateTime

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

    markNotaryViewed(id: ID!): UnsubmittedProfile @skipAuth
    addNotaryFeedback(id: ID!, feedback: String!): UnsubmittedProfile @skipAuth
    approveProfile(id: ID!): Boolean! @skipAuth
  }
`
