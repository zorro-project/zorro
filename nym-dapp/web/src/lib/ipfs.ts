import { create, CID } from 'ipfs-http-client'

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
  const block = await ipfsClient.add(JSON.stringify(components))
  return block.cid.toV1()
}

export default ipfsClient
