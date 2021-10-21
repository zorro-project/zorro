import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.NotaryFeedbackCreateArgs>({
  notaryFeedback: {
    one: {
      data: {
        feedback: 'String',
        updatedAt: '2021-10-21T14:08:44Z',
        UnsubmittedProfile: {
          create: {
            selfieCID: 'String',
            videoCID: 'String',
            ethAddress: 'String2793684',
            updatedAt: '2021-10-21T14:08:44Z',
          },
        },
      },
    },
    two: {
      data: {
        feedback: 'String',
        updatedAt: '2021-10-21T14:08:44Z',
        UnsubmittedProfile: {
          create: {
            selfieCID: 'String',
            videoCID: 'String',
            ethAddress: 'String920211',
            updatedAt: '2021-10-21T14:08:44Z',
          },
        },
      },
    },
  },
})

export type StandardScenario = typeof standard
