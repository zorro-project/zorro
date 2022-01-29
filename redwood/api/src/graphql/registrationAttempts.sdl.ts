export const schema = gql`
  type RegistrationAttempt {
    id: Int!

    ethereumAddress: String!
    photoCid: String!
    videoCid: String!

    notaryViewedAt: DateTime
    reviewedAt: DateTime
    approved: Boolean
    deniedReason: String

    createdAt: DateTime
  }

  type Query {
    unreviewedRegistrations: [RegistrationAttempt!]!
      @requireAuth(roles: ["NOTARY"])
    latestRegistration(ethereumAddress: ID!): RegistrationAttempt @skipAuth
  }

  input AttemptRegistrationInput {
    ethereumAddress: String!
    photoCid: String!
    videoCid: String!
  }

  type Mutation {
    attemptRegistration(input: AttemptRegistrationInput!): RegistrationAttempt!
      @skipAuth

    markRegistrationViewed(id: ID!): RegistrationAttempt
      @requireAuth(roles: ["NOTARY"])
    approveRegistration(id: ID!): RegistrationAttempt
      @requireAuth(roles: ["NOTARY"])
    denyRegistration(id: ID!, feedback: String!): RegistrationAttempt
      @requireAuth(roles: ["NOTARY"])
  }
`
