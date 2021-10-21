import type { Prisma } from '@prisma/client'
import type { ResolverArgs } from '@redwoodjs/graphql-server'

import { db } from 'src/lib/db'

export const notaryFeedbacks = () => {
  return db.notaryFeedback.findMany()
}

export const notaryFeedback = ({
  id,
}: Prisma.NotaryFeedbackWhereUniqueInput) => {
  return db.notaryFeedback.findUnique({
    where: { id },
  })
}

export const NotaryFeedback = {
  UnsubmittedProfile: (
    _obj,
    { root }: ResolverArgs<ReturnType<typeof notaryFeedback>>
  ) =>
    db.notaryFeedback
      .findUnique({ where: { id: root.id } })
      .UnsubmittedProfile(),
  isUnaddressed: (
    _obj,
    { root }: ResolverArgs<ReturnType<typeof notaryFeedback>>
  ) => db.notaryFeedback.findUnique({ where: { id: root.id } }).isUnaddressed(),
}
