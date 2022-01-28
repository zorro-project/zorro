import {quickAddJob} from 'graphile-worker'
import {db} from 'src/lib/db'
import syncStarknetState from './syncStarknetState'

const submitRegistrationAttempt = async (args: {id: number}) => {
  const registration = await db.registrationAttempt.findUnique({
    where: {id: args.id},
  })

  if (!registration?.approved) return

  const profile = await db.cachedProfile.findUnique({
    where: {ethereumAddress: registration.ethereumAddress},
  })

  // This profile is apparently already live on-chain, so no need to submit it again
  if (profile) return

  console.log('WOULD SUBMIT ATTEMPT', registration.id)

  // const cid = await cairoCompatibleAdd(
  //   JSON.stringify({
  //     photo: registration.photoCid,
  //     video: registration.videoCid,
  //   })
  // )
  // await notarySubmitProfile(
  //   serializeCid(cid),
  //   registration.ethereumAddress,
  //   notaryKey
  // )

  await syncStarknetState({onlyNewProfiles: true})
}

export default submitRegistrationAttempt

export const submitRegistrationAttemptBackground = async (id: number) => {
  quickAddJob({}, 'submitRegistrationAttempt', {id})
}
