import {quickAddJob} from 'graphile-worker'
import {serializeCid} from 'src/chain/serializers'
import {notarySubmitProfile} from 'src/chain/starknet'
import {db} from 'src/lib/db'
import {cairoCompatibleAdd} from 'src/lib/ipfs'
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

  console.log('Adding profile data to IPFS')
  const cid = await cairoCompatibleAdd(
    JSON.stringify({
      photo: registration.photoCid,
      video: registration.videoCid,
    })
  )
  console.log('Submitting profile')
  await notarySubmitProfile(
    serializeCid(cid),
    registration.ethereumAddress,
    process.env.STARKNET_NOTARY_PRIVATE_KEY
  )

  await syncStarknetState({onlyNewProfiles: true})
}

export default submitRegistrationAttempt

export const backgroundSubmitRegistration = async (id: number) => {
  quickAddJob({}, 'submitRegistrationAttempt', {id})
}
