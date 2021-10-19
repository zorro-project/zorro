import type { Prisma } from '@prisma/client'

import { db } from 'src/lib/db'

export const unsubmittedProfiles = () => {
  return db.unsubmittedProfile.findMany()
}

export const unsubmittedProfile = ({
  id,
}: Prisma.UnsubmittedProfileWhereUniqueInput) => {
  return db.unsubmittedProfile.findUnique({
    where: { id },
  })
}

interface CreateUnsubmittedProfileArgs {
  input: Prisma.UnsubmittedProfileCreateInput
}

export const createUnsubmittedProfile = ({
  input,
}: CreateUnsubmittedProfileArgs) => {
  return db.unsubmittedProfile.create({
    data: input,
  })
}

interface UpdateUnsubmittedProfileArgs
  extends Prisma.UnsubmittedProfileWhereUniqueInput {
  input: Prisma.UnsubmittedProfileUpdateInput
}

export const updateUnsubmittedProfile = ({
  id,
  input,
}: UpdateUnsubmittedProfileArgs) => {
  return db.unsubmittedProfile.update({
    data: input,
    where: { id },
  })
}

export const deleteUnsubmittedProfile = ({
  id,
}: Prisma.UnsubmittedProfileWhereUniqueInput) => {
  return db.unsubmittedProfile.delete({
    where: { id },
  })
}
