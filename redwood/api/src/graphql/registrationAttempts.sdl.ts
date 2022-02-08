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

    profileId: Int

    createdAt: DateTime
  }

  type Query {
    unreviewedRegistrations: [RegistrationAttempt!]!
      @requireAuth(roles: ["NOTARY"])
    latestRegistration(
      ethereumAddress: ID! @validateAddress
    ): RegistrationAttempt @skipAuth
    optimisticallyApprovedRegs: [RegistrationAttempt!]! @skipAuth
    optimisticallyApprovedReg(
      ethereumAddress: ID! @validateAddress
    ): RegistrationAttempt @skipAuth
  }

  input AttemptRegistrationInput {
    ethereumAddress: String! @validateAddress
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
