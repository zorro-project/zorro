import axios from "axios"
import {QueryfetchAddressTransactionsArgs} from 'api/types/graphql'

export const fetchAddressTransactions = async({ ethereumAddress }: QueryfetchAddressTransactionsArgs) => {
  try {
    const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${ethereumAddress}&page=1&offset=10&apikey=${process.env.ETHERSCAN_API_KEY}`)

    const transactionCount = etherscanResponse?.data?.result?.length

    return {
      transactionCount: transactionCount ?? 0,
      isFreshAddress: transactionCount === 0
    }
  } catch (error) {
    console.log(error)
    throw new Error('An error occured while fetching this address from Etherscan.')
  }
}