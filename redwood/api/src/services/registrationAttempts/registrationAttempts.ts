import dayjs from 'dayjs'
import {db} from 'src/lib/db'
import {NOTARY_PHONE_NUMBERS} from 'src/lib/protocolNotifications'
import {makeCall} from 'src/lib/twilio'
import sendNotaryApproved from 'src/mailers/sendNotaryApproved'
import {backgroundSubmitRegistration} from 'src/tasks/submitRegistrationAttempt'
import {
  MutationapproveRegistrationArgs,
  MutationattemptRegistrationArgs,
  MutationdenyRegistrationArgs,
  MutationmarkRegistrationViewedArgs,
  QuerylatestRegistrationArgs,
  QueryoptimisticallyApprovedRegArgs,
  QueryregistrationAttemptArgs,
} from 'types/graphql'
import {alertUpdated} from './helpers'

export const latestRegistrations = async () =>
  db.registrationAttempt.findMany({
    orderBy: {createdAt: 'desc'},
    take: 500,
  })

export const registrationAttempt = async ({id}: QueryregistrationAttemptArgs) =>
  db.registrationAttempt.findUnique({where: {id: parseInt(id, 10)}})

export const latestRegistration = ({
  ethereumAddress,
}: QuerylatestRegistrationArgs) =>
  db.registrationAttempt.findFirst({
    where: {ethereumAddress},
    orderBy: {createdAt: 'desc'},
  })

export const optimisticallyApprovedRegs = async () =>
  db.registrationAttempt.findMany({
    where: {approved: true, profileId: null},
    orderBy: {reviewedAt: 'desc'},
  })

export const optimisticallyApprovedReg = ({
  ethereumAddress,
}: QueryoptimisticallyApprovedRegArgs) =>
  db.registrationAttempt.findFirst({
    where: {approved: true, ethereumAddress},
    orderBy: {reviewedAt: 'desc'},
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

  alertNotariesNewAttempt()

  return registration
}

export const nextUnassignedRegistration = async () =>
  // Find the newest unreviewed registration. That way if we get super behind at least some of our users will still have a good experience.
  db.registrationAttempt.findFirst({
    where: {
      reviewedAt: null,
      approved: null,
      OR: [
        {
          notaryViewedAt: {lt: dayjs().subtract(2, 'minutes').toDate()},
        },
        {
          notaryViewedAt: null,
        },
      ],
    },
    orderBy: {createdAt: 'desc'},
  })

export const markRegistrationViewed = async ({
  id,
}: MutationmarkRegistrationViewedArgs) => {
  const registration = await db.registrationAttempt.update({
    where: {id: parseInt(id)},
    data: {notaryViewedAt: new Date()},
  })
  if (registration) alertUpdated(registration)
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
      reviewedById: context.currentUser.user!.id,
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

  registration = await db.registrationAttempt.update({
    where: {id: registration.id},
    data: {
      approved: true,
      reviewedAt: new Date(),
      reviewedById: context.currentUser!.user!.id,
    },
  })

  alertUpdated(registration)
  backgroundSubmitRegistration(registration.id)

  const user = await db.user.findUnique({
    where: {ethereumAddress: registration.ethereumAddress},
    select: {email: true},
  })

  if (user?.email) sendNotaryApproved(user?.email, registration.ethereumAddress)

  return registration
}

export const alertNotariesNewAttempt = async () => {
  const pendingCount = await db.registrationAttempt.count({
    where: {reviewedAt: null},
  })

  if (pendingCount > 0) {
    makeCall(
      NOTARY_PHONE_NUMBERS,
      `${pendingCount} Zorro registrations awaiting review.`
    )
  }
}
