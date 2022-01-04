export const schema = gql`
  type Connection {
    profileId: Int!
    purposeIdentifier: String!
    externalAddress: String!
    signature: String!
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
