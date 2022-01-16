import {CachedProfile} from '@prisma/client'
import {CID} from 'ipfs-http-client'
import {db} from 'src/lib/db'
import {
  parseBoolean,
  parseCid,
  parseEthereumAddress,
  parseNumber,
  parseStarknetAddress,
  parseTimestamp,
} from 'src/lib/serializers'
import {exportProfileById, getNumProfiles} from 'src/lib/starknet'
import {sendMessage} from 'src/lib/twilio'
import {
  currentStatus,
  isVerified,
  parseChallengeStatus,
} from 'src/services/cachedProfiles/cachedProfiles'
import {maybeNotify} from 'src/services/notifications/notifications'
import {NOTARIES} from 'src/services/unsubmittedProfiles/unsubmittedProfiles'

export default async function syncStarknetState(onlyNewProfiles = false) {
  console.log('Starting StarkNet sync')
  let currentId = 0
  let maxId = await getNumProfiles()

  if (onlyNewProfiles) {
    currentId =
      (await db.cachedProfile.aggregate({_max: {id: true}}))._max.id ??
      currentId
  }

  currentId = currentId + 1

  while (currentId <= maxId) {
    const newMaxId = (await importProfile(currentId))?.maxId
    if (newMaxId) maxId = newMaxId

    currentId = currentId + 1
  }

  // Remove cached profiles with an id > than the largest one on StarkNet
  // This should only matter in development; in production profiles are
  // never deleted or reset.

  await db.cachedProfile.deleteMany({
    where: {id: {gt: maxId}},
  })

  console.log('sync complete')
}

export const importProfile = async (profileId: number) => {
  console.log('Importing profile', profileId)
  const exported = await exportProfileById(profileId)
  if (exported == null) return
  const {profile} = exported

  const cid = parseCid(profile.cid)

  const profileFields = {
    cache: profile,

    cid: cid?.toV1().toString(),
    ...(await readCids(cid)),

    ethereumAddress: parseEthereumAddress(profile.ethereum_address),
    submissionTimestamp: parseTimestamp(profile.submission_timestamp),

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
    appealId: parseNumber(profile.appeal_id),
    superAdjudicationTimestamp: parseTimestamp(
      profile.super_adjudication_timestamp
    ),
    didSuperAdjudicatorVerifyProfile: parseBoolean(
      profile.did_super_adjudicator_verify_profile
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

export const readCids = async (cid: CID | null) => {
  if (cid == null) return {}

  const serializedCid = cid.toV1().toString()

  try {
    const existingProfile = await db.cachedProfile.findFirst({
      where: {cid: serializedCid},
    })
    if (existingProfile)
      return {
        videoCid: existingProfile.videoCid,
        photoCid: existingProfile.photoCid,
      }

    const data = await (
      await fetch(`https://${serializedCid}.ipfs.infura-ipfs.io`)
    ).json()

    return {videoCid: data.video, photoCid: data.photo}
  } catch (e) {
    console.log(`Failed to read from CID ${cid.toString()}`)
    return {videoCid: null, photoCid: null}
  }
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
        await sendMessage(NOTARIES, `New challenge to profile ${profile.id}`)
      }
    )
  }
}
