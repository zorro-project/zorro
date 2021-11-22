import '../../config/tests'
import { CID } from 'ipfs-http-client'
import { deserializeCid, serializeCid } from './cairoSerializers'

describe('serializeCID / deserializeCID', () => {
  test('round-trips a known-good CID', async () => {
    const cid = CID.parse('QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u')

    const result = serializeCid(cid)
    expect(deserializeCid(result)).toEqual(cid)
  })

  // Unfortunately the `ipfsClient` throws cryptic errors when I try to call it from Jest.
  // I think it expects more things from the Jest Node environment, which Redwood configures
  // to emulate the browser.

  // test('round-trips randomly-generated CIDs', () => {
  //   fc.assert(
  //     fc.asyncProperty(fc.string(), async (string) => {
  //       ipfsClient.add('test', { onlyHash: true })
  //       console.log(await IPFSHash.of(string))
  //       const cid = (await ipfsClient.add(string, { onlyHash: true })).cid
  //       expect(deserializeCid(serializeCid(cid))).toEqual(cid)
  //     })
  //   )
  // })
})
