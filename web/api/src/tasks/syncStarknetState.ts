import { Prisma } from '@prisma/client'
import { mapValues } from 'lodash'
import { db } from 'src/lib/db'
import { exportProfileById, getNumProfiles } from 'src/lib/starknet'

export default async function syncStarknetState(onlyNewProfiles = false) {
  console.log('Starting StarkNet sync')
  let currentId = 1
  let maxId = await getNumProfiles()

  if (onlyNewProfiles) {
    currentId =
      (
        await db.cachedProfile.aggregate({ _max: { profileId: true } })
      )._max.profileId?.toNumber() ?? currentId
  }

  while (currentId < maxId) {
    console.log(`Exporting profile ${currentId}`)
    const profile = await exportProfileById(currentId)

    console.log(profile)

    const profileFields = mapValues(
      profile.profile,
      (v) => new Prisma.Decimal(v)
    )
    console.log(profileFields)

    await db.cachedProfile.upsert({
      where: { profileId: currentId },
      create: {
        profileId: currentId,
        ...profileFields,
      },
      update: {
        ...profileFields,
      },
    })

    const challengeFields = mapValues(
      profile.challenge,
      (v) => new Prisma.Decimal(v)
    )

    await db.cachedChallenge.upsert({
      where: { profileId: currentId },
      create: {
        profileId: currentId,
        ...challengeFields,
      },
      update: {
        ...challengeFields,
      },
    })

    currentId = currentId.add(new Prisma.Decimal(1))
  }

  console.log('sync complete')
}

syncStarknetState()
