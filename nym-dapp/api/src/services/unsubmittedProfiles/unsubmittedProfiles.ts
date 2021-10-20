import type { Prisma } from '@prisma/client'

import { db } from 'src/lib/db'

export const unsubmittedProfiles = () => {
  return db.unsubmittedProfile.findMany()
}

export const unsubmittedProfile = ({
  ethAddress,
}: Prisma.UnsubmittedProfileWhereUniqueInput) => {
  return db.unsubmittedProfile.findUnique({
    where: { ethAddress },
  })
}

export const updateUnsubmittedProfile = ({ ethAddress, input }) => {
  return db.unsubmittedProfile.upsert({
    create: { ...input, ethAddress },
    update: { ...input },
    where: { ethAddress },
  })
}
