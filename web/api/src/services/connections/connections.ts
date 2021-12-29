import ethers from 'ethers'
import {result} from 'lodash'
import {db} from 'src/lib/db'
import {CachedProfile} from 'src/services/cachedProfiles/cachedProfiles'

export const connection = async ({purposeIdentifier, externalAddress}) => {
  return db.connection.findFirst({
    where: {purposeIdentifier, externalAddress},
  })
}

// This endpoint is used by the Snapshot strategy named `zorro`
export const getVerifiedExternalAddresses = async ({
  purposeIdentifier,
  externalAddresses,
  snapshot,
}) => {
  const connections = await db.connection.findMany({
    where: {
      purposeIdentifier,
      externalAddress: {in: externalAddresses.map((str) => str.toLowerCase())},
    },
    include: {
      cachedProfile: true,
    },
  })

  return connections
    .filter((connection) => CachedProfile.isVerified(connection.cachedProfile))
    .map((connection) => connection.externalAddress)
}

export const createConnection = async ({input}) => {
  // XXX: dedup message with frontend
  const message = `Connect Zorro to ${input.externalAddress}`
  const ethereumAddress = ethers.utils
    .verifyMessage(message, input.signature)
    .toLowerCase()

  const profileId = (
    await db.cachedProfile.findUnique({
      where: {ethereumAddress},
      select: {id: true},
    })
  ).id

  const createOrUpdate = {
    purposeIdentifier: input.purposeIdentifier,
    signature: input.signature,
    externalAddress: input.externalAddress.toLowerCase(),
    cachedProfile: {connect: {ethereumAddress}},
  }

  const connection = await db.connection.upsert({
    where: {
      profileId_purposeIdentifier: {
        profileId,
        purposeIdentifier: input.purposeIdentifier,
      },
    },
    create: createOrUpdate,
    update: createOrUpdate,
  })
  return connection
}
