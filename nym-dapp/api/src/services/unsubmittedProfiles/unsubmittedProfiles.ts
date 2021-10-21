import type { Prisma } from '@prisma/client'
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
    update: { ...input },
    where: { ethAddress },
  })
}

export const unsubmittedProfileSetEmail = ({ ethAddress, email }) =>
  db.unsubmittedProfile.update({ where: { ethAddress }, data: { email } })
