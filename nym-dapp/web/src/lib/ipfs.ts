import { create, CID } from 'ipfs-http-client'
import { assert } from './util'

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

type ProfileObject = {
  photo: string // The CID of the user's photo
  video: string // The CID of the user's video
}

export async function createProfileObject(
  components: ProfileObject
): Promise<CID> {
  const object = await ipfsClient.add(JSON.stringify(components), {
    pin: false,
  })

  const block = await ipfsClient.block.get(object.cid)
  const newBlock = await ipfsClient.block.put(block, { mhlen: 27 })

  console.log(newBlock.bytes.length)
  assert(newBlock.bytes.length === 31, 'Error: CIDs on Cairo must be 31 bytes')
  await ipfsClient.pin.add(newBlock)

  return newBlock.toV1()
}

export default ipfsClient
