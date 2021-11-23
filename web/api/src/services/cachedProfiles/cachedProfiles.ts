import { db } from 'src/lib/db'
import { CachedProfileConnection, ProfileStatus } from 'types/graphql'
import { ChallengeStatus } from '@prisma/client'

export const cachedProfiles = async ({
  first,
  cursor,
}): Promise<CachedProfileConnection> => {
  const profiles = await db.cachedProfile.findMany({
    cursor: cursor ? { id: parseInt(cursor, 10) } : undefined,
    orderBy: { id: 'desc' },
    take: first,
    skip: cursor ? 1 : 0,
  })

  const edges = profiles.map((profile) => ({
    cursor: profile.id.toString(),
    node: profile,
  }))

  const lastCursor = (
    await db.cachedProfile.aggregate({ _min: { id: true } })
  )._min.id.toString()
  const endCursor = edges[edges.length - 1].cursor

  return {
    id: '1',
    edges,
    pageInfo: {
      endCursor,
      hasNextPage: endCursor !== lastCursor,
    },
    count: await db.cachedProfile.count(),
  }
}

export const cachedProfile = async ({ address }) =>
  await db.cachedProfile.findFirst({ where: { address } })

const CHALLENGE_STATUSES: { [enumVal: number]: ChallengeStatus } = {
  0: 'not_challenged',
  1: 'challenged',
  2: 'adjudicated',
  3: 'adjudication_opportunity_expired',
  4: 'appealed',
  5: 'appeal_opportunity_expired',
  6: 'super_adjudicated',
  7: 'super_adjudication_opportunity_expired',
  8: 'settled',
}

export const parseChallengeStatus = (status: number): ChallengeStatus =>
  CHALLENGE_STATUSES[status]

export const CachedProfile = {
  status: (profile): ProfileStatus => 'submitted_via_notary',
}
