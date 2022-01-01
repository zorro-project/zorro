import {CachedProfile as PrismaCachedProfile, StatusEnum} from '@prisma/client'
import {db} from 'src/lib/db'
import {importProfile} from 'src/tasks/syncStarknetState'
import {ContractCache} from '../contractCache/contractCache'

export const cachedProfiles = async ({first, cursor}) => {
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
    await db.cachedProfile.aggregate({_min: {id: true}})
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

export const cachedProfile = async ({id, resync}) => {
  if (resync) await importProfile(parseInt(id, 10))

  const profile = await db.cachedProfile.findUnique({
    where: {id: parseInt(id, 10)},
  })
  return profile
}

export const cachedProfileByEthAddress = async ({ethereumAddress}) =>
  await db.cachedProfile.findUnique({
    where: {ethereumAddress},
  })

// Keep in sync with `StatusEnum` in `starknet/contracts/profile.cairo`
const STATUS_ENUMS: {[enumVal: number]: StatusEnum} = {
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

// Keep in sync with profile.cairo#_get_current_status

export const currentStatus = (
  profile: Pick<
    PrismaCachedProfile,
    | 'lastRecordedStatus'
    | 'challengeTimestamp'
    | 'adjudicationTimestamp'
    | 'appealTimestamp'
  >,
  now = new Date()
): StatusEnum => {
  if (profile.lastRecordedStatus === StatusEnum.NOT_CHALLENGED) {
    return StatusEnum.NOT_CHALLENGED
  } else if (profile.lastRecordedStatus === StatusEnum.CHALLENGED) {
    const timePassed = now.getTime() - profile.challengeTimestamp.getTime()
    const hasAppealOpportunityExpired =
      ContractCache.adjudicationTimeWindow + ContractCache.appealTimeWindow <
      timePassed
    if (hasAppealOpportunityExpired)
      return StatusEnum.APPEAL_OPPORTUNITY_EXPIRED

    const hasAdjudicationOpportunityExpired =
      ContractCache.adjudicationTimeWindow < timePassed
    if (hasAdjudicationOpportunityExpired)
      return StatusEnum.ADJUDICATION_ROUND_COMPLETED

    return StatusEnum.CHALLENGED
  } else if (
    profile.lastRecordedStatus === StatusEnum.ADJUDICATION_ROUND_COMPLETED
  ) {
    const timePassed = now.getTime() - profile.adjudicationTimestamp.getTime()

    const hasAppealOpportunityExpired =
      ContractCache.appealTimeWindow < timePassed
    if (hasAppealOpportunityExpired)
      return StatusEnum.APPEAL_OPPORTUNITY_EXPIRED

    return StatusEnum.ADJUDICATION_ROUND_COMPLETED
  } else if (profile.lastRecordedStatus === StatusEnum.APPEALED) {
    const timePassed = now.getTime() - profile.appealTimestamp.getTime()

    const hasSuperAdjudicationOpportunityExpired =
      ContractCache.superAdjudicationTimeWindow < timePassed
    if (hasSuperAdjudicationOpportunityExpired)
      return StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED

    return StatusEnum.APPEALED
  } else if (
    profile.lastRecordedStatus === StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED
  ) {
    return StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED
  } else if (profile.lastRecordedStatus === StatusEnum.SETTLED) {
    return StatusEnum.SETTLED
  } else {
    throw new Error(`Unknown profile status: ${profile.lastRecordedStatus}`)
  }
}

// Keep in sync with profile.cairo#get_is_in_provisional_time_window
const isInProvisionalTimeWindow = (
  profile: Pick<PrismaCachedProfile, 'submissionTimestamp'>,
  now = new Date()
): boolean => {
  const timePassed = now.getTime() - profile.submissionTimestamp.getTime()
  return timePassed < ContractCache.provisionalTimeWindow
}

// Keep in sync with profile.cairo#_get_is_verified
export const isVerified = (
  profile: Pick<
    PrismaCachedProfile,
    | 'lastRecordedStatus'
    | 'notarized'
    | 'challengeTimestamp'
    | 'superAdjudicationTimestamp'
    | 'didAdjudicatorVerifyProfile'
    | 'didSuperAdjudicatorVerifyProfile'
    | 'adjudicationTimestamp'
    | 'appealTimestamp'
    | 'submissionTimestamp'
  >,
  now = new Date()
): boolean => {
  const status = currentStatus(profile, now)
  if (status == StatusEnum.NOT_CHALLENGED) {
    const isProvisional = isInProvisionalTimeWindow(profile, now)
    return profile.notarized || !isProvisional
  } else if (status == StatusEnum.CHALLENGED) {
    const isPresumedInnocent =
      ContractCache.provisionalTimeWindow <
      profile.challengeTimestamp.getTime() -
        profile.submissionTimestamp.getTime()

    return isPresumedInnocent
  } else if (profile.superAdjudicationTimestamp != null) {
    return profile.didSuperAdjudicatorVerifyProfile
  } else if (profile.adjudicationTimestamp != null) {
    return profile.didAdjudicatorVerifyProfile
  } else return false
}

export const CachedProfile = {
  currentStatus: (_args, {root}) => currentStatus(root),
  isInProvisionalTimeWindow: (_args, {root}) => isInProvisionalTimeWindow(root),
  isVerified: (_args, {root}) => isVerified(root),
}
