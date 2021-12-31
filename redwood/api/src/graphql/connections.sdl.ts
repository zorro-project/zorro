export const schema = gql`
  type Connection {
    profileId: Int!
    purposeIdentifier: String!
    externalAddress: String!
    signature: String!
  }

  scalar Snapshot

  type Query {
    getVerifiedExternalAddresses(
      purposeIdentifier: String!
      externalAddresses: [String!]!
      snapshot: Snapshot
    ): [String!]! @skipAuth
  }

  input CreateConnectionInput {
    purposeIdentifier: String!
    externalAddress: String!
    signature: String!
  }

  type Mutation {
    createConnection(input: CreateConnectionInput!): Connection! @skipAuth
  }
`
