import assert from 'minimalistic-assert'
import {sanitizeHex} from 'starknet/dist/utils/encode'
import {CID} from 'ipfs-http-client'

type Felt = string

// Note: only safe for numbers that can be represented as a Javascript int
export const parseNumber = (number: Felt) => parseInt(number, 16)

export const parseBoolean = (boolean: Felt) => parseInt(boolean) === 1
export const parseTimestamp = (timestamp: Felt) =>
  parseInt(timestamp) > 0 ? new Date(parseInt(timestamp)) : null

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
    sanitizeHex(felt)
      .slice(2)
      .match(/.{2}/g)
      .map((byte) => parseInt(byte, 16))
  )

export const parseCid = (cid: Felt): CID | null =>
  isInitialized(cid) ? CID.decode(feltToBytes(cid)) : null
export const serializeCid = (cid: CID) => bytesToFelt(cid.bytes)

export const canonicalizeHex = (hex: string) =>
  sanitizeHex(hex.replace(/^0x0*/, '')).toLowerCase()

// Parses an address into an even-length hex string with 0 or 1 leading 0s.
export const parseAddress = (address: Felt) =>
  isInitialized(address) ? canonicalizeHex(address) : null

export const isInitialized = (felt: Felt) => felt && felt !== '0x0'
