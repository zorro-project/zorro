import type {Prisma} from '@prisma/client'
import {ResolverArgs} from '@redwoodjs/graphql-server'
import {db} from 'src/lib/db'
import ethers from 'ethers'

export const connection = async ({purposeIdentifier, externalAddress}) => {
  return db.connection.findUnique({
    where: {purposeIdentifier, externalAddress},
  })
}

export const createConnection = async ({input}) => {
  // XXX: dedup message with frontend
  const message = `Connect Zorro to ${input.externalAddress}`
  const ethereumAddress = ethers.utils
    .verifyMessage(message, input.signature)
    .toLowerCase()

  const connection = await db.connection.create({
    data: {
      ...input,
      cachedProfile: {connect: {ethereumAddress}},
    },
  })
  return connection
}
