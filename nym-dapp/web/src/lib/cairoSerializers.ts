import chunk from 'lodash/chunk'
import { CID } from 'multiformats/cid'
import { assert } from './util'

type CairoCID = {
  low: bigint
  high: bigint
}

// The maximum number of bytes we can safely store in a Felt
const FELT_MAX_BYTES = 31

const bytesToFelt = (bytes: Uint8Array): bigint => {
  assert(
    bytes.length <= FELT_MAX_BYTES,
    'Trying to serialize more than bytes to a felt than supported, serialization will fail'
  )

  return BigInt(
    '0x' +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
  )
}

const feltToBytes = (felt: bigint, numBytes: number): Uint8Array => {
  assert(
    numBytes <= FELT_MAX_BYTES,
    'Trying to deserialize more bytes from a felt than supported, deserialization will fail'
  )

  let feltAsHex = felt.toString(16).padStart(numBytes * 2, '0')
  feltAsHex = feltAsHex.slice(feltAsHex.length - numBytes * 2)
  return new Uint8Array(
    chunk(feltAsHex, 2).map((b) => parseInt(b.join(''), 16))
  )
}

export const serializeCid = (cid: CID): CairoCID => {
  assert(
    cid.byteLength == 34,
    "Error, CID isn't 34 bytes, serialization will fail"
  )

  return {
    high: bytesToFelt(cid.bytes.slice(0, 3)),
    low: bytesToFelt(cid.bytes.slice(3, 34)),
  }
}

export const deserializeCid = (cairoCID: CairoCID): CID => {
  const bytes = new Uint8Array(34)
  bytes.set(feltToBytes(cairoCID.high, 3), 0)
  bytes.set(feltToBytes(cairoCID.low, 31), 3)
  return CID.decode(bytes)
}
