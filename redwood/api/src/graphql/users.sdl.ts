export const schema = gql`
  type User {
    id: ID!
    ethereumAddress: String!
    hasEmail: Boolean!
  }

  type CurrentUser {
    id: ID!
    ethereumAddress: String!
    email: String!
    roles: [String!]!
  }

  type Query {
    user(ethereumAddress: ID!): User @skipAuth
    currentUser: CurrentUser @requireAuth
  }

  input CreateUserInput {
    ethereumAddress: String!
    email: String
  }

  type Mutation {
    createUser(input: CreateUserInput!): User! @skipAuth

    requestSessionAuthString(ethereumAddress: String!): String! @skipAuth
    requestSessionToken(ethereumAddress: String!, signature: String!): String
      @skipAuth
  }
`
