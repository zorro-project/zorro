export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    photoCid: String!
    videoCid: String!
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
    photoCid: String!
    videoCid: String!
    address: String!
  }

  input UpdateUnsubmittedProfileInput {
    photoCid: String
    videoCid: String
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

    addNotaryFeedback(id: Int!, feedback: String!): Boolean! @skipAuth
    approveProfile(id: Int!): Boolean! @skipAuth
  }
`
