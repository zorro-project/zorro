import {RoleEnum} from '@prisma/client'
import {AuthenticationError, ForbiddenError} from '@redwoodjs/graphql-server'
import {compact} from 'lodash'
import {db} from './db'

// Only return fields that are safe to be shared with the client.
export const getCurrentUser = async (_: unknown, {token}: {token: string}) => {
  if (token == null || token.length < 10) return null
  return db.user.findFirst({
    where: {
      UserSession: {
        some: {token, expiresAt: {gt: new Date()}},
      },
    },
    select: {
      id: true,
      ethereumAddress: true,
      roles: true,
    },
  })
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

export const isAuthenticated = (): boolean => {
  return !!context.currentUser
}

export const hasRole = (roles: (RoleEnum | string | null)[]): boolean =>
  context.currentUser?.roles?.some((r) => compact(roles).includes(r)) ?? false

export const requireAuth = (args?: {
  roles?: (RoleEnum | null | string)[] | null
}) => {
  if (!isAuthenticated()) {
    throw new AuthenticationError("You don't have permission to do that.")
  }

  const roles = args?.roles ?? []
  if (roles.length > 0 && !hasRole(roles)) {
    throw new ForbiddenError("You don't have access to do that.")
  }
}
