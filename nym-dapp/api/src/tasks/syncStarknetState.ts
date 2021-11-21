import { db } from 'src/lib/db'
import { exportProfileById } from 'src/lib/starknet'

export default async function syncStarknetState(
  onlyNewProfiles: boolean = false
) {
  let currentId = 1

  if (onlyNewProfiles) {
    currentId =
      (await db.cachedProfile.aggregate({ _max: { profileId: true } }))._max
        .profileId + 1
  }

  while (true) {
    const profile = await exportProfileById(currentId)
    break
  }
}
