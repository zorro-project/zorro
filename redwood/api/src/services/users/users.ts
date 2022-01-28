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

export const user = async ({ethereumAddress}: QueryuserArgs) =>
  db.user.findUnique({where: {ethereumAddress}})

export const currentUser = async () => {
  db.user.findFirst()
}

export const createUser = async ({input}: MutationcreateUserArgs) =>
  db.user.create({data: input})

export const User = {
  hasEmail: (
    _args: void,
    {root}: ResolverArgs<NonNullable<Awaited<ReturnType<typeof user>>>>
  ) => root.email !== null,
}

export const requestSessionAuthString = async ({
  ethereumAddress,
}: MutationrequestSessionAuthStringArgs) => {
  const nonce = crypto.randomBytes(8).toString('hex')
  const sessionAuthString = `Sign this message to authenticate yourself at zorro.xyz\n\nAddress: ${ethereumAddress}\nNonce: ${nonce}`

  await db.user.upsert({
    where: {ethereumAddress},
    create: {
      ethereumAddress,
      sessionAuthString,
    },
    update: {sessionAuthString},
  })
  return sessionAuthString
}

export const requestSessionToken = async ({
  ethereumAddress,
  signature,
}: MutationrequestSessionTokenArgs) => {
  const user = await db.user.findUnique({where: {ethereumAddress}})
  if (!user?.sessionAuthString) return null

  // Check if the signature is valid
  const address = verifyMessage(user.sessionAuthString, signature)
  if (address !== ethereumAddress) return null

  // Clear the auth string to ensure a given signed message can only be used
  // once.
  await db.user.update({
    where: {ethereumAddress},
    data: {sessionAuthString: null},
  })
  const session = await db.userSession.create({
    data: {
      User: {connect: {id: user.id}},
      token: crypto.randomBytes(64).toString('base64url'),
      expiresAt: dayjs().add(1, 'month').toDate(),
    },
  })
  return session.token
}
