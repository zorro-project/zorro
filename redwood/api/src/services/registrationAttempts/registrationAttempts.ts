import {WEB_DOMAIN} from 'src/lib/config'
import {db} from 'src/lib/db'
import {NOTARY_PHONE_NUMBERS} from 'src/lib/protocolNotifications'
import {sendMessage} from 'src/lib/twilio'
import sendNotaryApproved from 'src/mailers/sendNotaryApproved'
import {backgroundSubmitRegistration} from 'src/tasks/submitRegistrationAttempt'
import {
  MutationapproveRegistrationArgs,
  MutationattemptRegistrationArgs,
  MutationdenyRegistrationArgs,
  MutationmarkRegistrationViewedArgs,
  QuerylatestRegistrationArgs,
} from 'types/graphql'
import {alertUpdated} from './helpers'

export const optimisticallyApprovedRegs = async () =>
  db.registrationAttempt.findMany({
    where: {approved: true, profileId: null},
    orderBy: {reviewedAt: 'desc'},
  })

export const unreviewedRegistrations = async () =>
  db.registrationAttempt.findMany({where: {reviewedAt: null}})

export const latestRegistration = ({
  ethereumAddress,
}: QuerylatestRegistrationArgs) =>
  db.registrationAttempt.findFirst({
    where: {ethereumAddress},
    orderBy: {createdAt: 'desc'},
  })

export const attemptRegistration = async ({
  input,
}: MutationattemptRegistrationArgs) => {
  const pendingRegistration = await db.registrationAttempt.findFirst({
    where: {ethereumAddress: input.ethereumAddress, reviewedAt: null},
  })
  if (pendingRegistration)
    throw new Error('Existing registration pending, cannot resubmit')

  const registration = await db.registrationAttempt.create({
    data: {
      ...input,
    },
  })

  const pendingCount = (await unreviewedRegistrations()).length

  if (pendingCount > 0) {
    await sendMessage(
      NOTARY_PHONE_NUMBERS,
      `${pendingCount} Zorro registrations awaiting review. ${WEB_DOMAIN}/unreviewed-registrations`
    )
  }

  return registration
}

export const markRegistrationViewed = async ({
  id,
}: MutationmarkRegistrationViewedArgs) => {
  let registration = await db.registrationAttempt.findFirst({
    where: {id: parseInt(id), notaryViewedAt: null},
  })
  if (!registration) return null

  registration = await db.registrationAttempt.update({
    where: {id: registration.id},
    data: {notaryViewedAt: new Date()},
  })
  alertUpdated(registration)
  return registration
}

const unreviewedRegistration = (id: string) =>
  db.registrationAttempt.findFirst({
    where: {id: parseInt(id), reviewedAt: null, approved: null},
  })

export const denyRegistration = async ({
  id,
  feedback,
}: MutationdenyRegistrationArgs) => {
  let registration = await unreviewedRegistration(id)
  if (!registration) return null

  if (!context.currentUser) return null

  registration = await db.registrationAttempt.update({
    where: {id: registration.id},
    data: {
      approved: false,
      reviewedAt: new Date(),
      reviewedById: context.currentUser.id,
      deniedReason: feedback,
    },
  })

  alertUpdated(registration)
  return registration
}

export const approveRegistration = async ({
  id,
}: MutationapproveRegistrationArgs) => {
  let registration = await unreviewedRegistration(id)

  if (!registration) return null

  if (!context.currentUser) return null

  registration = await db.registrationAttempt.update({
    where: {id: registration.id},
    data: {
      approved: true,
      reviewedAt: new Date(),
      reviewedById: context.currentUser.id,
    },
  })

  alertUpdated(registration)
  backgroundSubmitRegistration(registration.id)

  const user = await db.user.findUnique({
    where: {ethereumAddress: registration.ethereumAddress},
    select: {email: true},
  })

  if (user?.email)
    await sendNotaryApproved(user?.email, registration.ethereumAddress)

  return registration
}
