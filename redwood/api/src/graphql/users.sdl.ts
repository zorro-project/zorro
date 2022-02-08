export const schema = gql`
  type User {
    id: ID!
    ethereumAddress: String!
    email: String
  }

  type Mutation {
    setEmail(email: String!): User! @requireAuth

    requestSessionToken(
      ethereumAddress: String! @validateAddress
      expiresAt: String!
      signature: String!
    ): String @skipAuth
  }
`
