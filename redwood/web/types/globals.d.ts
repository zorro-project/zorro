import {ApiProcessEnv} from 'src/lib/api'

// Keep in sync with `includeEnvironmentVariables` from redwood.toml
type SharedEnvVariables = Pick<
  ApiProcessEnv,
  | 'CHAIN_DEPLOYMENT'
  | 'INFURA_IPFS_ID'
  | 'INFURA_IPFS_SECRET'
  | 'PUSHER_KEY'
  | 'PUSHER_CLUSTER'
>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends SharedEnvVariables {}
  }

  const RWJS_API_URL: string // eslint-disable-line no-var
  const web3: Object | undefined
}

export {}
