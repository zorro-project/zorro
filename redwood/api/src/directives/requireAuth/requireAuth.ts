import gql from 'graphql-tag'

import {createValidatorDirective} from '@redwoodjs/graphql-server'

import {requireAuth as applicationRequireAuth} from 'src/lib/auth'
import {
  requireAuthDirectiveArgs,
  requireAuthDirectiveResolver,
} from 'types/graphql'

export const schema = gql`
  """
  Use to check whether or not a user is authenticated and is associated
  with an optional set of roles.
  """
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

// @ts-expect-error directives aren't strongly typed yet
const validate: requireAuthDirectiveResolver = ({
  directiveArgs,
}: {
  directiveArgs: requireAuthDirectiveArgs
}) => {
  const {roles} = directiveArgs
  applicationRequireAuth({roles})
}

const requireAuth = createValidatorDirective(schema, validate)

export default requireAuth
