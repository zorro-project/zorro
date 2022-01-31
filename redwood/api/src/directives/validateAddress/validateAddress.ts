import {
  createTransformerDirective,
  TransformerDirectiveFunc,
} from '@redwoodjs/graphql-server'
import {getAddress} from 'ethers/lib/utils'

export const schema = gql`
  """
  Checks that the address is a valid Ethereum address. Addresses that are not valid Ethereum addresses or that have a bad checksum are rejected.
  """
  directive @validateAddress on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
`

const transform: TransformerDirectiveFunc = ({resolvedValue}) =>
  getAddress(resolvedValue)

export default createTransformerDirective(schema, transform)
