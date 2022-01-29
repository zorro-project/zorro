import {create, CID} from 'ipfs-http-client'
import assert from 'minimalistic-assert'

const auth =
  'Basic ' +
  btoa(process.env.INFURA_IPFS_ID + ':' + process.env.INFURA_IPFS_SECRET)

const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})

export default ipfsClient

export async function cairoCompatibleAdd(data: string | Blob): Promise<CID> {
  const object = await ipfsClient.add(data, {
    pin: false,
  })

  const block = await ipfsClient.block.get(object.cid)

  // The cid v1 adds 4 bytes of overhead to the hash size, so we need to
  // limit our hash to 27 bytes to fit within the 31-byte Cairo felt size.
  // @ts-expect-error it seems that ipfs-core-types type definitions are incomplete
  const newBlock = await ipfsClient.block.put(block, {mhlen: 27})

  assert(newBlock.bytes.length === 31, 'Error: cids on Cairo must be 31 bytes')
  await ipfsClient.pin.add(newBlock)

  return newBlock.toV1()
}
