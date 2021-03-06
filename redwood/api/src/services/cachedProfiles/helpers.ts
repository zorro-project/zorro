import {CachedProfile as PrismaCachedProfile, StatusEnum} from '@prisma/client'
import {ContractCache} from '../contractCache/contractCache'

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
    const timePassed =
      now.getTime() - (profile.challengeTimestamp?.getTime() ?? 0)
    const hasAppealOpportunityExpired =
      ContractCache.adjudicationPeriod + ContractCache.appealPeriod < timePassed
    if (hasAppealOpportunityExpired)
      return StatusEnum.APPEAL_OPPORTUNITY_EXPIRED

    const hasAdjudicationOpportunityExpired =
      ContractCache.adjudicationPeriod < timePassed
    if (hasAdjudicationOpportunityExpired)
      return StatusEnum.ADJUDICATION_ROUND_COMPLETED

    return StatusEnum.CHALLENGED
  } else if (
    profile.lastRecordedStatus === StatusEnum.ADJUDICATION_ROUND_COMPLETED
  ) {
    const timePassed =
      now.getTime() - (profile.adjudicationTimestamp?.getTime() ?? 0)

    const hasAppealOpportunityExpired = ContractCache.appealPeriod < timePassed
    if (hasAppealOpportunityExpired)
      return StatusEnum.APPEAL_OPPORTUNITY_EXPIRED

    return StatusEnum.ADJUDICATION_ROUND_COMPLETED
  } else if (profile.lastRecordedStatus === StatusEnum.APPEALED) {
    const timePassed = now.getTime() - (profile.appealTimestamp?.getTime() ?? 0)

    const hasSuperAdjudicationOpportunityExpired =
      ContractCache.superAdjudicationPeriod < timePassed
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

// Keep in sync with profile.cairo#get_is_in_provisional_period
export const isInProvisionalPeriod = (
  profile: Pick<PrismaCachedProfile, 'submissionTimestamp'>,
  now = new Date()
): boolean => {
  const timePassed = now.getTime() - profile.submissionTimestamp.getTime()
  return timePassed < ContractCache.provisionalPeriod
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
    | 'didSuperAdjudicatorOverturnAdjudicator'
    | 'adjudicationTimestamp'
    | 'appealTimestamp'
    | 'submissionTimestamp'
  >,
  now = new Date()
): boolean => {
  const status = currentStatus(profile, now)
  if (status == StatusEnum.NOT_CHALLENGED) {
    const isProvisional = isInProvisionalPeriod(profile, now)
    return profile.notarized || !isProvisional
  } else if (status == StatusEnum.CHALLENGED) {
    const isPresumedInnocent =
      ContractCache.provisionalPeriod <
      (profile.challengeTimestamp?.getTime() ?? 0) -
        profile.submissionTimestamp.getTime()

    return isPresumedInnocent
  } else if (profile.superAdjudicationTimestamp != null) {
    return profile.didSuperAdjudicatorOverturnAdjudicator
      ? !profile.didAdjudicatorVerifyProfile
      : profile.didAdjudicatorVerifyProfile
  } else if (profile.adjudicationTimestamp != null) {
    return profile.didAdjudicatorVerifyProfile
  } else return false
}
