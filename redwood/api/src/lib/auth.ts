import Iron from '@hapi/iron'
import {RoleEnum} from '@prisma/client'
import {AuthenticationError, ForbiddenError} from '@redwoodjs/graphql-server'
import dayjs from 'dayjs'
import {compact} from 'lodash'
import {db} from './db'
import type {Replaced} from '../../types/utils'
import {isVerified} from '../services/cachedProfiles/helpers'

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

  const {ethereumAddress} = sessionData

  const [user, registrationAttempt, rawCachedProfile] = await Promise.all([
    db.user.findFirst({
      where: {ethereumAddress},
      select: {
        id: true,
        ethereumAddress: true,
        roles: true,
        email: true,
      },
    }),
    db.registrationAttempt.findFirst({
      where: {ethereumAddress},
      orderBy: {createdAt: 'desc'},
      select: {
        id: true,
        approved: true,
        ethereumAddress: true,
        photoCid: true,
        reviewedAt: true,
      },
    }),
    db.cachedProfile.findUnique({
      where: {ethereumAddress},
      select: {
        id: true,
        ethereumAddress: true,
        lastRecordedStatus: true,
        notarized: true,
        challengeTimestamp: true,
        superAdjudicationTimestamp: true,
        didAdjudicatorVerifyProfile: true,
        didSuperAdjudicatorOverturnAdjudicator: true,
        adjudicationTimestamp: true,
        appealTimestamp: true,
        submissionTimestamp: true,
        photoCid: true,
      },
    }),
  ])

  const cachedProfile = rawCachedProfile && {
    ...rawCachedProfile,
    isVerified: isVerified(rawCachedProfile),
  }

  return {user, registrationAttempt, cachedProfile}
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

// Redwood's serialization round-trip converts dates to ISO8601 strings.
export type ClientCurrentUser = Replaced<CurrentUser, Date, string>

export const isAuthenticated = (): boolean => {
  return !!context.currentUser
}

export const hasRole = (roles: (RoleEnum | string | null)[]): boolean =>
  context.currentUser?.user?.roles?.some((r) => compact(roles).includes(r)) ??
  false

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
