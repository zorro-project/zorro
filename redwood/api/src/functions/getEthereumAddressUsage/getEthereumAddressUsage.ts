import {Handler} from 'aws-lambda'

export const handler: Handler = async (event) => {
  const ethereumAddress = event.queryStringParameters.address
  const isFresh = await (!process.env.ETHERSCAN_API_KEY
    ? () => {
        console.log(
          'Not checking ethereum address freshness because missing etherscan api key'
        )
        return true
      }
    : async () => {
        const params = {
          module: 'account',
          action: 'txlist',
          address: ethereumAddress,
          page: 1, // XXX: check to see whether page should be `0` or `1`
          offset: 1, // number of results per page
          apikey: process.env.ETHERSCAN_API_KEY,
        }
        // TODO: we should probably check polygon, bsc, and avascan as well, because they're quite popular
        const response = await fetch(
          `https://api.etherscan.io/api?${new URLSearchParams(params)}`
        )
        const result = await response.json()
        console.log('etherscan result!', result)
        const numTransactions = result.result.length
        return numTransactions === 0
      })()

  return {
    statusCode: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({isFresh}),
  }
}
