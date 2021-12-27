// Redwood only generates client-side types if you have at least one cell. :(
// https://github.com/redwoodjs/redwood/blob/47f744eead912be29706abf819970587f51fdb6f/packages/internal/src/generate/typeDefinitions.ts#L222

import type {FindPlaceholderQuery} from 'types/graphql'
import type {CellSuccessProps, CellFailureProps} from '@redwoodjs/web'

export const QUERY = gql``

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({error}: CellFailureProps) => (
  <div style={{color: 'red'}}>Error: {error.message}</div>
)

export const Success = ({
  placeholder,
}: CellSuccessProps<FindPlaceholderQuery>) => {
  return <div>{JSON.stringify(placeholder)}</div>
}
