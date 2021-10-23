import '../../config/tests'
import { CID } from 'ipfs-http-client'
import fc from 'fast-check'
import { bytesToFelts, feltsToBytes } from './cairoSerializers'

describe('bytesToFelt / feltToBytes', () => {
  test('CID round trip', async () => {
    const cid = CID.parse('QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u')

    const result = bytesToFelts(cid.bytes)
    expect(result.length).toBe(2)
    expect(feltsToBytes(result)).toEqual(cid.bytes)
  })

  test('never serializes to 0', (async) => {
    const result = bytesToFelts(Uint8Array.from([0]))
    expect(result).toEqual(1)
  })

  test('Property testing', () => {
    fc.assert(
      fc.property(fc.uint8Array({ min: 0, maxLength: 63 }), (array) =>
        expect(feltsToBytes(bytesToFelts(array))).toEqual(array)
      )
    )
  })
})
