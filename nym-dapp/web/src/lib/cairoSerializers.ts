import chunk from 'lodash/chunk'

// The maximum number of bytes we can safely store in a Felt
const FELT_MAX_BYTES = 31

// Serialize a Uint8Array into an array of Felt-sized `BigInt`s, suitable for storing on StarkNet.
export const bytesToFelts = (bytes: Uint8Array): bigint[] => {
  // We want to return the same `bytes` array from `feltToBytes` that we received in
  // `byteToFelts`, without adding or removing any padding. To achieve this, we'll
  // record the number of significant bits in the first Felt as the first byte of the
  // encoded list of felts.
  const firstFeltSignificantBytes = bytes.length % FELT_MAX_BYTES
  const firstFeltPadding = Array(
    FELT_MAX_BYTES - firstFeltSignificantBytes - 1
  ).fill(0)
  const bytesToEncode = [firstFeltSignificantBytes].concat(
    firstFeltPadding,
    Array.from(bytes)
  )
  console.assert(
    bytesToEncode.length % FELT_MAX_BYTES == 0,
    `Error, padding not correctly applied! ([${bytesToEncode}], ${bytesToEncode.length})`
  )

  const bytesAsHex = bytesToEncode.map((b) => b.toString(16).padStart(2, '0'))

  return chunk(bytesAsHex, FELT_MAX_BYTES).map((chunk) =>
    BigInt('0x' + chunk.join(''))
  )
}

// Deserializes an array of Felt-sized `BigInt`s serialized with the corresponding `bytesToFelts` function back into the original `Uint8Array`.
export const feltsToBytes = (felts: bigint[]): Uint8Array => {
  const hexString = felts
    .map((felt) => felt.toString(16).padStart(FELT_MAX_BYTES * 2, '0'))
    .join('')

  const byteArray = chunk(hexString, 2).map((hex) => parseInt(hex.join(''), 16))
  const totalPadding = FELT_MAX_BYTES - byteArray[0]
  return new Uint8Array(byteArray.slice(totalPadding))
}
