import assert from 'minimalistic-assert'
import { sanitizeHex } from 'starknet/dist/utils/encode'
import { CID } from 'ipfs-http-client'

type Felt = string

// Note: only safe for numbers that can be represented as a Javascript int
export const parseNumber = (number: Felt) => parseInt(number, 16)

export const parseBoolean = (boolean: Felt) => parseInt(boolean) === 1
export const parseTimestamp = (timestamp: Felt) =>
  parseInt(timestamp) > 0 ? new Date(parseInt(timestamp)) : null

export const bytesToFelt = (bytes: Uint8Array) => {
  assert(bytes.length <= 31, 'Error: CIDs on Cairo must be 31 bytes')

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

export const isInitialized = (felt: Felt) => felt !== '0x0'
