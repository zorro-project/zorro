export const schema = gql`
  type AddressInformation {
    transactionCount: number
    isFreshAddress: boolean
  }

  type Query {
    fetchAddressTransactions(ethereumAddress: ID!) AddressInformation! @skipAuth
  }
`