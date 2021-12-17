import { CID } from 'ipfs-http-client'
import { db } from 'src/lib/db'
import { Prisma } from '@prisma/client'
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
  const { profile, num_profiles } = await exportProfileById(profileId)

  console.log(profile)

  const profileFields: Prisma.CachedProfileCreateInput = {
    cache: profile,

    CID: parseCid(profile.cid).toV1().toString(),
    // TODO: memoize this
    ...(await readCIDs(parseCid(profile.cid))),

    starknetAddress: sanitizeHex(profile.starknet_address),
    ethereumAddress: sanitizeHex(profile.ethereum_address),
    submissionTimestamp: parseTimestamp(profile.submission_timestamp),

    notarized: parseBoolean(profile.is_notarized),

    lastRecordedStatus: parseChallengeStatus(
      parseNumber(profile.last_recorded_status)
    ),
    challengeTimestamp: parseTimestamp(profile.challenge_timestamp),
    challengerAddress: sanitizeHex(profile.challenger_address),
    challengeEvidenceCID: parseCid(profile.challenge_evidence_cid)
      ?.toV1()
      .toString(),
    ownerEvidenceCID: parseCid(profile.adjudicator_evidence_cid)
      ?.toV1()
      .toString(),

    adjudicationTimestamp: parseTimestamp(profile.adjudication_timestamp),
    adjudicatorEvidenceCID: parseCid(profile.adjudicator_evidence_cid)
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
    where: { id: profileId },
    create: {
      id: profileId,
      ...profileFields,
    },
    update: {
      ...profileFields,
    },
  })

  return { maxId: parseNumber(num_profiles) }
}

export const readCIDs = async (cid: CID) => {
  const data = await (
    await fetch(`https://${cid.toV1().toString()}.ipfs.infura-ipfs.io`)
  ).json()

  console.log({ data })
  return { videoCID: data.video.toString(), photoCID: data.photo.toString() }
}
