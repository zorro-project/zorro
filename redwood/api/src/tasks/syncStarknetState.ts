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

  const now = parseTimestamp(exported.now)
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
