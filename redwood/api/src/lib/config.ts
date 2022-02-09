type UrlConfig = {
  protocol: 'http://' | 'https://'
  domain: string
}

const urlConfigs: Record<typeof process.env.CHAIN_DEPLOYMENT, UrlConfig> = {
  test: {
    protocol: 'http://',
    domain: 'localhost:8910',
  },
  development: {
    protocol: 'http://',
    domain: 'localhost:8910',
  },
  staging: {
    protocol: 'https://',
    domain: 'testnet.zorro.xyz',
  },
  production: {
    protocol: 'https://',
    domain: 'zorro.xyz',
  },
}

export const urlConfig = urlConfigs[process.env.CHAIN_DEPLOYMENT]

export const urlBase = urlConfig.protocol + urlConfig.domain
