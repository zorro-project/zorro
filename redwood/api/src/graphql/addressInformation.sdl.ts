export const schema = gql`
  type AddressInformation {
    transactionCount: Int!
    isFreshAddress: Boolean!
  }

  type Query {
    fetchAddressTransactions(ethereumAddress: ID!): AddressInformation! @skipAuth
  }
`