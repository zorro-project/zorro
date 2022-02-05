import {RoleEnum} from '@prisma/client'
import {AuthenticationError, ForbiddenError} from '@redwoodjs/graphql-server'
import {compact} from 'lodash'
import {db} from './db'
import Iron from '@hapi/iron'
import dayjs from 'dayjs'

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production')
  throw new Error('SESSION_SECRET must be set in production. See .env.example')

export const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  'fallback_secret_fallback_secret_fallback_secret'

export type SessionData = {
  ethereumAddress: string
  expiresAt: string
}

// Only return fields that are safe to be shared with the client!
export const getCurrentUser = async (_: unknown, {token}: {token: string}) => {
  if (token == null || token.length < 10) return null
  const sessionData: SessionData = await Iron.unseal(
    token,
    SESSION_SECRET,
    Iron.defaults
  )

  // If we've passed the expiration date you need a new token
  if (dayjs(sessionData.expiresAt).isBefore(dayjs())) return null

  return db.user.findFirst({
    where: {
      ethereumAddress: sessionData.ethereumAddress,
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
