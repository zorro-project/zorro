export const schema = gql`
  type User {
    id: ID!
    ethereumAddress: String!
    hasEmail: Boolean!
  }

  type Query {
    user(ethereumAddress: ID!): User @skipAuth
  }

  input CreateUserInput {
    ethereumAddress: String!
    email: String
  }

  type Mutation {
    createUser(input: CreateUserInput!): User! @skipAuth
  }
`
