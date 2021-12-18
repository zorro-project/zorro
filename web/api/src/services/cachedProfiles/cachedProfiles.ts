import { db } from 'src/lib/db'
import { CachedProfileConnection, ProfileStatus } from 'types/graphql'
import { StatusEnum } from '@prisma/client'

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

export const cachedProfile = async ({ ethereumAddress }) =>
  await db.cachedProfile.findUnique({
    where: { ethereumAddress: ethereumAddress as string },
  })

// Keep in sync with `StatusEnum` in `starknet/contracts/profile.cairo`
const STATUS_ENUMS: { [enumVal: number]: StatusEnum } = {
  0: StatusEnum.NOT_CHALLENGED,
  1: StatusEnum.CHALLENGED,
  2: StatusEnum.ADJUDICATION_ROUND_COMPLETED,
  3: StatusEnum.APPEALED,
  4: StatusEnum.APPEAL_OPPORTUNITY_EXPIRED,
  5: StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED,
  6: StatusEnum.SETTLED,
}

export const parseChallengeStatus = (status: number): StatusEnum =>
  STATUS_ENUMS[status]

export const CachedProfile = {
  status: (profile): ProfileStatus => 'submitted_via_notary',
}
