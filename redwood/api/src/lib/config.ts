export const WEB_DOMAIN: Record<typeof process.env.CHAIN_DEPLOYMENT, string> = {
  test: 'http://localhost:8910',
  development: 'http://localhost:8910',
  staging: 'https://testnet.zorro.xyz',
  production: 'https://zorro.xyz',
}
