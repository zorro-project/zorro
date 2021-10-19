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
    unsubmittedProfile(id: Int!): UnsubmittedProfile @requireAuth
  }

  input CreateUnsubmittedProfileInput {
    selfieCID: String!
    videoCID: String!
    ethAddress: String!
  }

  input UpdateUnsubmittedProfileInput {
    selfieCID: String
    videoCID: String
    ethAddress: String
  }

  type Mutation {
    createUnsubmittedProfile(
      input: CreateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @requireAuth
    updateUnsubmittedProfile(
      id: Int!
      input: UpdateUnsubmittedProfileInput!
    ): UnsubmittedProfile! @requireAuth
    deleteUnsubmittedProfile(id: Int!): UnsubmittedProfile! @requireAuth
  }
`
