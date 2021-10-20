export const schema = gql`
  type UnsubmittedProfile {
    id: Int!
    selfieCID: String!
    videoCID: String!
    ethAddress: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    unsubmittedProfiles: [UnsubmittedProfile!]! @requireAuth
    unsubmittedProfile(ethAddress: String!): UnsubmittedProfile @skipAuth
  }

  input CreateUnsubmittedProfileInput {
    selfieCID: String!
    videoCID: String!
    ethAddress: String!
  }

  input UpdateUnsubmittedProfileInput {
    selfieCID: String
    videoCID: String
  }

  type Mutation {
    updateUnsubmittedProfile(
      ethAddress: String!
      input: UpdateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @skipAuth
  }
`
