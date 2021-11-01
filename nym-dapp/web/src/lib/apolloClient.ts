import { InMemoryCacheConfig } from '@apollo/client'

export const cacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    UnsubmittedProfile: {
      keyFields: ['ethAddress'],
    },
  },
}
