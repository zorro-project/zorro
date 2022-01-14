import axios from "axios"

export const fetchAddressTransactions = async(ethereumAddress: string) => {
  try {
    const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${ethereumAddress}&page=1&offset=10&apikey=${process.env.ETHERSCAN_API_KEY}`)

    if (etherscanResponse.data.results.length === 0) return true

    return false
  } catch (error) {
    throw new Error('An error occured while fetching this address from Etherscan.')
  }
}