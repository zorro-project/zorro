export const schema = gql`
  type Connection {
    profileId: Int!
    purposeIdentifier: String!
    externalAddress: String!
    signature: String!
  }

  type Query {
    getVerifiedExternalAddresses(
      purposeIdentifier: String!
      externalAddresses: [String!]!
      snapshot: String
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
