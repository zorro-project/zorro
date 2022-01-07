import type {Prisma} from '@prisma/client'
import {db} from 'src/lib/db'
import {sendMessage} from 'src/lib/twilio'
import sendNotaryApproved from 'src/mailers/sendNotaryApproved'
import sendNotaryFeedback from 'src/mailers/sendNotaryFeedback'
import syncStarknetState from 'src/tasks/syncStarknetState'
import 'src/lib/pusher'
import {pusher} from 'src/lib/pusher'
import {
  MutationaddNotaryFeedbackArgs,
  MutationapproveProfileArgs,
  MutationResolvers,
  MutationunsubmittedProfileSetEmailArgs,
  MutationupdateUnsubmittedProfileArgs,
  QueryunsubmittedProfileArgs,
  QueryunsubmittedProfilesArgs,
} from 'api/types/graphql'
import {ResolverArgs} from '@redwoodjs/graphql-server'

const alertProfileUpdated = (profile: {id: number}) =>
  pusher.trigger(`unsubmittedProfile.${profile.id}`, 'updated', {})

// Just hard-code these for now. Will get fancier later.
export const NOTARIES = [
  '+18016131318', // Kyle
  '+16175958777', // Ted
]

export const unsubmittedProfiles = async ({
  pendingReview,
}: QueryunsubmittedProfilesArgs) => {
  const whereClause: Prisma.UnsubmittedProfileWhereInput = {}
  if (pendingReview) whereClause.unaddressedFeedbackId = null
  return db.unsubmittedProfile.findMany({
    where: whereClause,
  })
}

export const unsubmittedProfile = async ({
  ethereumAddress,
}: QueryunsubmittedProfileArgs) => {
  const record = await db.unsubmittedProfile.findUnique({
    where: {ethereumAddress},
  })
  return record ? {...record, hasEmail: !!record.email} : null
}

export const updateUnsubmittedProfile = async ({
  ethereumAddress,
  input,
}: MutationupdateUnsubmittedProfileArgs) => {
  const profile = await db.unsubmittedProfile.upsert({
    create: {...input, ethereumAddress},
    update: {...input, unaddressedFeedbackId: null},
    where: {ethereumAddress},
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

export const unsubmittedProfileSetEmail = ({
  ethereumAddress,
  email,
}: MutationunsubmittedProfileSetEmailArgs) =>
  db.unsubmittedProfile.update({where: {ethereumAddress}, data: {email}})

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

export const addNotaryFeedback: MutationResolvers['addNotaryFeedback'] =
  async ({id, feedback}: MutationaddNotaryFeedbackArgs) => {
    // TODO: authenticate that the given user is an approved notary

    const notaryFeedback = await db.notaryFeedback.create({
      data: {UnsubmittedProfile: {connect: {id}}, feedback},
    })

    await db.unsubmittedProfile.update({
      where: {id},
      data: {unaddressedFeedbackId: notaryFeedback.id},
    })

    const profile = await db.unsubmittedProfile.findUnique({
      where: {id},
      include: {UnaddressedFeedback: true},
    })

    alertProfileUpdated(profile)

    if (profile.email) {
      await sendNotaryFeedback(
        profile.email,
        profile.UnaddressedFeedback.feedback
      )
    }

    return true
  }

export const approveProfile = async ({id}: MutationapproveProfileArgs) => {
  const profile = await db.unsubmittedProfile.findUnique({
    where: {id},
  })

  syncStarknetState(true)

  alertProfileUpdated(profile)
  await db.unsubmittedProfile.delete({where: {id}})

  if (profile.email) {
    await sendNotaryApproved(profile.email, profile.ethereumAddress)
  }
  return true
}
