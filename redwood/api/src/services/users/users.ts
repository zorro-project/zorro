import Iron from '@hapi/iron'
import dayjs from 'dayjs'
import {verifyMessage} from 'ethers/lib/utils'
import {SessionData, SESSION_SECRET} from 'src/lib/auth'
import {db} from 'src/lib/db'
import {
  MutationrequestSessionTokenArgs,
  MutationsetEmailArgs,
} from 'types/graphql'

export const setEmail = async ({email}: MutationsetEmailArgs) =>
  db.user.update({
    where: {id: context.currentUser!.user!.id},
    data: {email},
  })

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
