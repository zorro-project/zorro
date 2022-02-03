import {CachedProfile} from '@prisma/client'
import {
  parseBigNumber,
  parseBigNumberAsDecimalString,
  parseBoolean,
  parseCid,
  parseEthereumAddress,
  parseNumber,
  parseStarknetAddress,
  parseTimestamp,
} from 'src/chain/serializers'
import {exportProfileById} from 'src/chain/starknet'
import {db} from 'src/lib/db'
import {NOTARY_PHONE_NUMBERS} from 'src/lib/protocolNotifications'
import {sendMessage} from 'src/lib/twilio'
import {
  currentStatus,
  isVerified,
  parseChallengeStatus,
} from 'src/services/cachedProfiles/helpers'
import {maybeNotify} from 'src/services/notifications/notifications'
import {alertUpdated} from 'src/services/registrationAttempts/helpers'
import parseProfileCid from './parseProfileCid'

const importProfile = async (profileId: number) => {
  console.log('Importing profile', profileId)
  const exported = await exportProfileById(profileId)
  if (exported == null) return
  const {profile} = exported

  const cid = parseCid(profile.cid)

  const profileFields = {
    cache: profile,

    cid: cid?.toV1().toString(),
    ...(await parseProfileCid(cid)),

    ethereumAddress: parseEthereumAddress(profile.ethereum_address),
    submissionTimestamp: parseTimestamp(profile.submission_timestamp)!,

    notarized: parseBoolean(profile.is_notarized),

    lastRecordedStatus: parseChallengeStatus(
      parseNumber(profile.last_recorded_status)
    ),
    challengeTimestamp: parseTimestamp(profile.challenge_timestamp),
    challengerAddress: parseStarknetAddress(profile.challenger_address),
    challengeEvidenceCid: parseCid(profile.challenge_evidence_cid)
      ?.toV1()
      .toString(),
    ownerEvidenceCid: parseCid(profile.adjudicator_evidence_cid)
      ?.toV1()
      .toString(),

    adjudicationTimestamp: parseTimestamp(profile.adjudication_timestamp),
    adjudicatorEvidenceCid: parseCid(profile.adjudicator_evidence_cid)
      ?.toV1()
      .toString(),
    didAdjudicatorVerifyProfile: parseBoolean(
      profile.did_adjudicator_verify_profile
    ),

    appealTimestamp: parseTimestamp(profile.appeal_timestamp),
    appealId:
      parseBigNumber(profile.appeal_id) == BigInt(0)
        ? null
        : parseBigNumberAsDecimalString(profile.appeal_id),
    superAdjudicationTimestamp: parseTimestamp(
      profile.super_adjudication_timestamp
    ),
    didSuperAdjudicatorOverturnAdjudicator: parseBoolean(
      profile.did_super_adjudicator_overturn_adjudicator
    ),
  }

  const persistedProfile = await db.cachedProfile.upsert({
    where: {id: profileId},
    create: {
      id: profileId,
      ...profileFields,
    },
    update: {
      ...profileFields,
    },
  })
  if (persistedProfile.ethereumAddress) {
    const {count} = await db.registrationAttempt.updateMany({
      where: {ethereumAddress: persistedProfile.ethereumAddress},
      data: {
        profileId: persistedProfile.id,
      },
    })
    if (count > 0)
      alertUpdated({ethereumAddress: persistedProfile.ethereumAddress})
  }

  const now = parseTimestamp(exported.now) ?? new Date()
  const status = parseChallengeStatus(parseNumber(exported.current_status))
  if (status !== currentStatus(profileFields, now)) {
    console.warn(
      `Profile ${profileId} status mismatch. ${
        exported.current_status
      } expected, ${currentStatus(profileFields, now)} derived`
    )
  }

  const isVerifiedOnStarknet = parseBoolean(exported.is_verified)
  if (isVerifiedOnStarknet !== isVerified(profileFields, now)) {
    console.warn(
      `Profile ${profileId} isVerified mismatch. ${
        exported.is_verified
      } expected, ${isVerified(profileFields, now)} derived`
    )
  }

  await sendNotifications(persistedProfile)

  return {maxId: parseNumber(exported.num_profiles)}
}

export const sendNotifications = async (profile: CachedProfile) => {
  if (profile.challengeTimestamp !== null) {
    await maybeNotify(
      {
        type: 'NEW_CHALLENGE',
        profileId: profile.id,
        challengeTimestamp: profile.challengeTimestamp.toISOString(),
      },
      async () => {
        // Just send a message to the notaries for now. Later we'll probably
        // want to post this to a Discord channel.
        await sendMessage(
          NOTARY_PHONE_NUMBERS,
          `New challenge to profile ${profile.id}`
        )
      }
    )
  }
}

export default importProfile
