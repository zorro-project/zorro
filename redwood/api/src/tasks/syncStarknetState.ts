import {Prisma} from '@prisma/client'
import {CID} from 'ipfs-http-client'
import {db} from 'src/lib/db'
import {
  parseAddress,
  parseBoolean,
  parseCid,
  parseNumber,
  parseTimestamp,
} from 'src/lib/serializers'
import {exportProfileById, getNumProfiles} from 'src/lib/starknet'
import {
  CachedProfile,
  currentStatus,
  isVerified,
  parseChallengeStatus,
} from 'src/services/cachedProfiles/cachedProfiles'

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
    const {maxId} = await importProfile(currentId)

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
  const {profile} = exported

  const profileFields = {
    cache: profile,

    cid: parseCid(profile.cid).toV1().toString(),
    // TODO: memoize this
    ...(await readCids(parseCid(profile.cid))),

    ethereumAddress: parseAddress(profile.ethereum_address),
    submissionTimestamp: parseTimestamp(profile.submission_timestamp),

    notarized: parseBoolean(profile.is_notarized),

    lastRecordedStatus: parseChallengeStatus(
      parseNumber(profile.last_recorded_status)
    ),
    challengeTimestamp: parseTimestamp(profile.challenge_timestamp),
    challengerAddress: parseAddress(profile.challenger_address),
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
    superAdjudicationTimestamp: parseTimestamp(
      profile.super_adjudication_timestamp
    ),
    didSuperAdjudicatorVerifyProfile: parseBoolean(
      profile.did_super_adjudicator_verify_profile
    ),
  }

  await db.cachedProfile.upsert({
    where: {id: profileId},
    create: {
      id: profileId,
      ...profileFields,
    },
    update: {
      ...profileFields,
    },
  })

  const status = parseChallengeStatus(parseNumber(exported.current_status))
  if (status !== currentStatus(profileFields)) {
    console.warn(
      `Profile ${profileId} status mismatch. ${
        exported.current_status
      } expected, ${currentStatus(profileFields)} derived`
    )
  }

  const isVerifiedonStarkNet = parseBoolean(exported.is_verified)
  if (isVerifiedonStarkNet !== isVerified(profileFields)) {
    console.warn(
      `Profile ${profileId} isVerified mismatch. ${
        exported.is_verified
      } expected, ${isVerified(profileFields)} derived`
    )
  }

  return {maxId: parseNumber(exported.num_profiles)}
}

export const readCids = async (cid: CID) => {
  try {
    const data = await (
      await fetch(`https://${cid.toV1().toString()}.ipfs.infura-ipfs.io`)
    ).json()

    return {videoCid: data.video.toString(), photoCid: data.photo.toString()}
  } catch (e) {
    console.log(`Failed to read CID ${cid.toV1().toString()}`)
    return {videoCid: null, photoCid: null}
  }
}
