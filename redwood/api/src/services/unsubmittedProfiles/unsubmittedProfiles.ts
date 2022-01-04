import type {Prisma} from '@prisma/client'
import {ResolverArgs} from '@redwoodjs/graphql-server'
import {db} from 'src/lib/db'
import {sendMessage} from 'src/lib/twilio'
import sendNotaryApproved from 'src/mailers/sendNotaryApproved'
import sendNotaryFeedback from 'src/mailers/sendNotaryFeedback'
import syncStarknetState from 'src/tasks/syncStarknetState'

// Just hard-code these for now. Will get fancier later.
export const NOTARIES = [
  '+18016131318', // Kyle
  '+16175958777', // Ted
]

export const unsubmittedProfiles = async ({pendingReview}) => {
  const whereClause: Prisma.UnsubmittedProfileWhereInput = {}
  if (pendingReview) whereClause.unaddressedFeedbackId = null
  return db.unsubmittedProfile.findMany({
    where: whereClause,
  })
}

export const unsubmittedProfile = async ({
  address,
}: Prisma.UnsubmittedProfileWhereUniqueInput) => {
  const record = await db.unsubmittedProfile.findUnique({
    where: {address},
  })
  return record ? {...record, hasEmail: !!record.email} : null
}

export const updateUnsubmittedProfile = async ({address, input}) => {
  const profile = await db.unsubmittedProfile.upsert({
    create: {...input, address},
    update: {...input, unaddressedFeedbackId: null},
    where: {address},
  })

  const pendingCount = (await unsubmittedProfiles({pendingReview: true})).length

  if (pendingCount > 0) {
    await sendMessage(
      NOTARIES,
      `${pendingCount} Zorro profiles awaiting review. http://localhost:8910/unsubmitted-profiles`
    )
  }

  return profile
}

export const unsubmittedProfileSetEmail = ({address, email}) =>
  db.unsubmittedProfile.update({where: {address}, data: {email}})

export const UnsubmittedProfile = {
  UnaddressedFeedback: (
    _obj,
    {root}: ResolverArgs<ReturnType<typeof unsubmittedProfile>>
  ) =>
    db.unsubmittedProfile
      .findUnique({where: {id: root.id}})
      .UnaddressedFeedback(),
  NotaryFeedback: (
    _obj,
    {root}: ResolverArgs<ReturnType<typeof unsubmittedProfile>>
  ) =>
    db.unsubmittedProfile.findUnique({where: {id: root.id}}).NotaryFeedback(),
}

export const addNotaryFeedback = async ({profileId, feedback}) => {
  // TODO: authenticate that the given user is an approved notary

  const notaryFeedback = await db.notaryFeedback.create({
    data: {unsubmittedProfileId: profileId, feedback},
  })

  await db.unsubmittedProfile.update({
    where: {id: profileId},
    data: {unaddressedFeedbackId: notaryFeedback.id},
  })

  const profile = await db.unsubmittedProfile.findUnique({
    where: {id: profileId},
    include: {UnaddressedFeedback: true},
  })

  if (profile.email) {
    await sendNotaryFeedback(
      profile.email,
      profile.UnaddressedFeedback.feedback
    )
  }

  return true
}

export const approveProfile = async ({id}) => {
  const profile = await db.unsubmittedProfile.findUnique({
    where: {id},
  })

  syncStarknetState(true)

  // await db.unsubmittedProfile.delete({ where: { id } })

  if (profile.email) {
    await sendNotaryApproved(profile.email, profile.address)
  }
  return true
}
