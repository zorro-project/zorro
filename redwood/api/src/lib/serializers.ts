import assert from 'minimalistic-assert'
import {removeHexPrefix, sanitizeHex} from 'starknet/dist/utils/encode'
import {CID} from 'ipfs-http-client'
import {getAddress} from 'ethers/lib/utils'

type Felt = string

// Note: only safe for numbers that can be represented as a Javascript int
export const parseNumber = (number: Felt) => parseInt(number, 16)

// Would love to return an actual javascript BigInt here instead of a string,
// but it looks like Prisma might not support BigInts properly yet:
// https://github.com/redwoodjs/redwood/issues/1733
export const parseBigNumber = (number: Felt) => BigInt(number).toString(10)

export const parseBoolean = (boolean: Felt) => parseInt(boolean) === 1
export const parseTimestamp = (timestamp: Felt) => new Date(parseInt(timestamp))

export const bytesToFelt = (bytes: Uint8Array) => {
  assert(bytes.length <= 31, 'Error: cids on Cairo must be 31 bytes')

  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

export const feltToBytes = (felt: Felt) =>
  new Uint8Array(
    (sanitizeHex(felt).slice(2).match(/.{2}/g) as string[]).map((byte) =>
      parseInt(byte, 16)
    )
  )

export const parseCid = (cid: Felt): CID | null => {
  if (!isInitialized(cid)) return null
  try {
    return CID.decode(feltToBytes(cid))
  } catch (e) {
    return null
  }
}

export const serializeCid = (cid: CID) => bytesToFelt(cid.bytes)

const canonicalizeHex = (hex: string) =>
  sanitizeHex(hex.replace(/^0x0*/, '')).toLowerCase()

// Parses an address into an even-length hex string with 0 or 1 leading 0s.
export const parseStarknetAddress = (address: Felt) =>
  isInitialized(address) ? canonicalizeHex(address) : null

// Parses an ethereum address into its checksummed form.
export const parseEthereumAddress = (address: Felt) => {
  if (!isInitialized(address)) return null
  if (removeHexPrefix(address).length > 40) return null

  try {
    return getAddress(removeHexPrefix(address).padStart(40, '0'))
  } catch (e) {
    return null
  }
}

export const numToHex = (num: number) => '0x' + num.toString(16)

export const isInitialized = (felt: Felt) => felt && felt !== '0x0'
