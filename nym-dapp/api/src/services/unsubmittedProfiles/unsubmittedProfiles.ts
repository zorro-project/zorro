import type { Prisma } from '@prisma/client'
import { ResolverArgs } from '@redwoodjs/graphql-server'
import { db } from 'src/lib/db'

export const unsubmittedProfiles = () => {
  return db.unsubmittedProfile.findMany()
}

export const unsubmittedProfile = async ({
  ethAddress,
}: Prisma.UnsubmittedProfileWhereUniqueInput) => {
  const record = await db.unsubmittedProfile.findUnique({
    where: { ethAddress },
  })
  return { ...record, hasEmail: !!record.email }
}

export const updateUnsubmittedProfile = ({ ethAddress, input }) => {
  return db.unsubmittedProfile.upsert({
    create: { ...input, ethAddress },
    update: { ...input, unaddressedFeedbackId: null },
    where: { ethAddress },
  })
}

export const unsubmittedProfileSetEmail = ({ ethAddress, email }) =>
  db.unsubmittedProfile.update({ where: { ethAddress }, data: { email } })

export const UnsubmittedProfile = {
  UnaddressedFeedback: (
    _obj,
    { root }: ResolverArgs<ReturnType<typeof unsubmittedProfile>>
  ) =>
    db.unsubmittedProfile
      .findUnique({ where: { id: root.id } })
      .UnaddressedFeedback(),
  NotaryFeedback: (
    _obj,
    { root }: ResolverArgs<ReturnType<typeof unsubmittedProfile>>
  ) =>
    db.unsubmittedProfile
      .findUnique({ where: { id: root.id } })
      .NotaryFeedback(),
}
