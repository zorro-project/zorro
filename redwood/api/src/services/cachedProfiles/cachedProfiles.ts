import {CachedProfile as PrismaCachedProfile} from '@prisma/client'
import importProfile from 'src/chain/importers/importProfile'
import {db} from 'src/lib/db'
import {
  QuerycachedProfileArgs,
  QuerycachedProfileByEthereumAddressArgs,
  QuerycachedProfilesArgs,
} from 'types/graphql'
import {ContractCache} from '../contractCache/contractCache'
import {currentStatus, isVerified} from './helpers'

export const cachedProfiles = async ({
  first,
  cursor,
}: QuerycachedProfilesArgs) => {
  const profiles = await db.cachedProfile.findMany({
    cursor: cursor ? {id: parseInt(cursor, 10)} : undefined,
    orderBy: {id: 'desc'},
    take: first,
    skip: cursor ? 1 : 0,
  })

  const edges = profiles.map((profile) => ({
    cursor: profile.id.toString(),
    node: profile,
  }))

  const lastCursor = (
    (await db.cachedProfile.aggregate({_min: {id: true}}))._min?.id ?? 0
  ).toString()
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

export const cachedProfile = async ({id, resync}: QuerycachedProfileArgs) => {
  if (resync) await importProfile(parseInt(id, 10))

  const profile = await db.cachedProfile.findUnique({
    where: {id: parseInt(id, 10)},
  })
  return profile
}

export const cachedProfileByEthereumAddress = async ({
  ethereumAddress,
}: QuerycachedProfileByEthereumAddressArgs) =>
  await db.cachedProfile.findUnique({
    where: {ethereumAddress},
  })

// Keep in sync with profile.cairo#get_is_in_provisional_period
const isInProvisionalTimeWindow = (
  profile: Pick<PrismaCachedProfile, 'submissionTimestamp'>,
  now = new Date()
): boolean => {
  const timePassed = now.getTime() - profile.submissionTimestamp.getTime()
  return timePassed < ContractCache.provisionalTimeWindow
}

export const CachedProfile = {
  currentStatus: (_args: void, {root}: {root: PrismaCachedProfile}) =>
    currentStatus(root),
  isInProvisionalTimeWindow: (
    _args: void,
    {root}: {root: PrismaCachedProfile}
  ) => isInProvisionalTimeWindow(root),
  isVerified: (_args: void, {root}: {root: PrismaCachedProfile}) =>
    isVerified(root),
}
