import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.CachedProfileCreateArgs>({
  cachedProfile: {
    one: {
      data: {
        ethAddress: 'String6467552',
        status: 'submitted_via_notary',
        CID: 'String',
        createdTimestamp: '2021-10-27T10:17:59Z',
      },
    },
    two: {
      data: {
        ethAddress: 'String3063853',
        status: 'submitted_via_notary',
        CID: 'String',
        createdTimestamp: '2021-10-27T10:17:59Z',
      },
    },
  },
})

export type StandardScenario = typeof standard
