import fs from 'fs'
export const CHAIN_DEPLOYMENTS_DIR = './chain-deployments'

export function save(
  name: string,
  contract: any,
  network: string,
  deployment: string
) {
  fs.writeFileSync(
    `${CHAIN_DEPLOYMENTS_DIR}/${deployment}/${name}.json`,
    JSON.stringify({
      network,
      address: contract.address,
    })
  )
}
