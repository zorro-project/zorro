import type {ResolverArgs} from '@redwoodjs/graphql-server'
import {db} from 'src/lib/db'
import {
  MutationcreateUserArgs,
  MutationrequestSessionAuthStringArgs,
  MutationrequestSessionTokenArgs,
  QueryuserArgs,
} from 'types/graphql'
import crypto from 'crypto'
import dayjs from 'dayjs'
import {verifyMessage} from 'ethers/lib/utils'
import Iron from '@hapi/iron'
import {SessionData, SESSION_SECRET} from 'src/lib/auth'

export const user = async ({ethereumAddress}: QueryuserArgs) =>
  db.user.findUnique({where: {ethereumAddress}})

export const createUser = async ({input}: MutationcreateUserArgs) =>
  db.user.create({data: input})

export const User = {
  hasEmail: (
    _args: void,
    {root}: ResolverArgs<NonNullable<Awaited<ReturnType<typeof user>>>>
  ) => root.email !== null,
}

export const requestSessionToken = async ({
  ethereumAddress,
  signature,
  expiresAt,
}: MutationrequestSessionTokenArgs) => {
  // Check if the signature is valid
  const address = verifyMessage(expiresAt, signature)
  if (address !== ethereumAddress) return null

  // Check that expiresAt falls in the qualified range
  const expiresAtDate = dayjs(expiresAt)
  if (
    expiresAtDate.isBefore(dayjs()) ||
    expiresAtDate.isAfter(dayjs().add(16, 'days'))
  )
    return null

  await db.user.upsert({
    where: {ethereumAddress},
    create: {ethereumAddress},
    update: {},
  })
  const sessionData: SessionData = {
    ethereumAddress,
    expiresAt: expiresAtDate.toISOString(),
  }
  const token = await Iron.seal(sessionData, SESSION_SECRET, Iron.defaults)
  return token
}
