import importProfile from 'src/chain/importers/importProfile'
import {getNumProfiles} from 'src/chain/starknet'
import {db} from 'src/lib/db'

const syncStarknetState = async ({onlyNewProfiles = false} = {}) => {
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

export default syncStarknetState
