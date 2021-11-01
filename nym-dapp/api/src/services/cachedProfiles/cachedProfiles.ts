import { db } from 'src/lib/db'
import { CachedProfile, CachedProfileConnection } from 'types/graphql'

export const cachedProfiles = async ({
  first,
  cursor,
}): Promise<CachedProfileConnection> => {
  const profiles = await db.cachedProfile.findMany({
    cursor: cursor ? { nymId: parseInt(cursor, 10) } : undefined,
    orderBy: { nymId: 'desc' },
    take: first,
    skip: 1,
  })

  const edges = profiles.map((profile) => ({
    cursor: profile.nymId.toString(),
    node: profile,
  }))

  const lastCursor = (
    await db.cachedProfile.aggregate({ _min: { nymId: true } })
  )._min.nymId.toString()
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

export const cachedProfile = async ({ ethAddress }): Promise<CachedProfile> =>
  await db.cachedProfile.findFirst({ where: { ethAddress } })
