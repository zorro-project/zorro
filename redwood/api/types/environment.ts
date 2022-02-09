export type ApiProcessEnv = {
  CHAIN_DEPLOYMENT: 'test' | 'development' | 'staging' | 'production'
  NODE_ENV?: 'development' | 'production' | 'test'

  // Infura IPFS
  INFURA_IPFS_ID?: string
  INFURA_IPFS_SECRET?: string

  // Twilio
  TWILIO_SID?: string
  TWILIO_TOKEN?: string
  TWILIO_NUMBER?: string

  // Pusher
  PUSHER_APP_ID?: string
  PUSHER_KEY?: string
  PUSHER_SECRET?: string
  PUSHER_CLUSTER?: string

  // Email
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASSWORD: string

  STARKNET_NOTARY_PRIVATE_KEY: string

  SESSION_SECRET?: string
}
