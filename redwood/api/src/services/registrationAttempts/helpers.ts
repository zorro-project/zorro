import * as Prisma from '@prisma/client'
import {pusher} from 'src/lib/pusher'

export const alertUpdated = (
  attempt: Pick<Prisma.RegistrationAttempt, 'ethereumAddress'>
) =>
  pusher?.trigger(
    `registrationAttempt.${attempt.ethereumAddress}`,
    'updated',
    {}
  )
