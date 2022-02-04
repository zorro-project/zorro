const WEB_DOMAINS: Record<typeof process.env.CHAIN_DEPLOYMENT, string> = {
  test: 'http://localhost:8910',
  development: 'http://localhost:8910',
  staging: 'https://testnet.zorro.xyz',
  production: 'https://zorro.xyz',
}

export const WEB_DOMAIN = WEB_DOMAINS[process.env.CHAIN_DEPLOYMENT]
