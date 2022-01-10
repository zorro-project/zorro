interface IProcessEnv {
  CHAIN_DEPLOYMENT: 'development' | 'production' | 'test'
  INFURA_IPFS_ID?: string
  INFURA_IPFS_SECRET?: string
  PUSHER_KEY?: string
  PUSHER_CLUSTER?: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends IProcessEnv {}
  }
}

export {}
