import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.UnsubmittedProfileCreateArgs>({
  unsubmittedProfile: {
    one: {
      data: {
        photoCID: 'String',
        videoCID: 'String',
        ethAddress: 'String',
        updatedAt: '2021-10-19T14:11:15Z',
      },
    },
    two: {
      data: {
        photoCID: 'String',
        videoCID: 'String',
        ethAddress: 'String',
        updatedAt: '2021-10-19T14:11:15Z',
      },
    },
  },
})

export type StandardScenario = typeof standard
