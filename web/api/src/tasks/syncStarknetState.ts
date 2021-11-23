import { CID } from 'ipfs-http-client'
import { db } from 'src/lib/db'
import { exportProfileById, getNumProfiles } from 'src/lib/starknet'
import {
  parseBoolean,
  parseCid,
  parseNumber,
  parseTimestamp,
} from 'src/lib/serializers'
import { parseChallengeStatus } from 'src/services/cachedProfiles/cachedProfiles'
import { sanitizeHex } from 'starknet/dist/utils/encode'

export default async function syncStarknetState(onlyNewProfiles = false) {
  console.log('Starting StarkNet sync')
  let currentId = 0
  let maxId = await getNumProfiles()

  if (onlyNewProfiles) {
    currentId =
      (await db.cachedProfile.aggregate({ _max: { id: true } }))._max.id ??
      currentId
  }

  currentId = currentId + 1

  while (currentId <= maxId) {
    ;({ maxId } = await importProfile(currentId))

    currentId = currentId + 1
  }

  console.log('sync complete')
}

export const importProfile = async (profileId: number) => {
  console.log(`Importing profile ${profileId}`)
  const profile = await exportProfileById(profileId)

  console.log(profile)

  const profileFields = {
    cache: profile.profile,
    notarized: parseBoolean(profile.profile.is_notarized),
    submissionTimestamp: parseTimestamp(profile.profile.submission_timestamp),
    CID: parseCid(profile.profile.cid).toV1().toString(),
    address: sanitizeHex(profile.profile.address),

    // TODO: only do this step if the CID has changed, not every time
    ...(await readCIDs(parseCid(profile.profile.cid))),
  }

  await db.cachedProfile.upsert({
    where: { id: profileId },
    create: {
      id: profileId,
      ...profileFields,
    },
    update: {
      ...profileFields,
    },
  })

  const challengeFields = {
    cache: profile.challenge,
    lastRecordedStatus: parseChallengeStatus(
      parseNumber(profile.challenge.last_recorded_status)
    ),
    challengeTimestamp: parseTimestamp(profile.challenge.challenge_timestamp),
    adjudicationTimestamp: parseTimestamp(
      profile.challenge.adjudication_timestamp
    ),
    superAdjudicationTimestamp: parseTimestamp(
      profile.challenge.super_adjudication_timestamp
    ),

    challengeEvidence: parseCid(profile.challenge.challenge_evidence_cid)
      ?.toV1()
      .toString(),
    profileOwnerEvidence: parseCid(profile.challenge.profile_owner_evidence_cid)
      ?.toV1()
      .toString(),
    adjudicatorEvidence: parseCid(profile.challenge.adjudicator_evidence_cid)
      ?.toV1()
      .toString(),
    didAdjudicatorConfirmProfile: parseBoolean(
      profile.challenge.did_adjudicator_confirm_profile
    ),
    appealTimestamp: parseTimestamp(profile.challenge.appeal_timestamp),
  }

  await db.cachedChallenge.upsert({
    where: { profileId },
    create: {
      profileId,
      ...challengeFields,
    },
    update: {
      ...challengeFields,
    },
  })

  return { maxId: parseNumber(profile.num_profiles) }
}

export const readCIDs = async (cid: CID) => {
  const data = await (
    await fetch(`https://${cid.toV1().toString()}.ipfs.infura-ipfs.io`)
  ).json()

  console.log({ data })
  return { videoCID: data.video.toString(), photoCID: data.photo.toString() }
}
