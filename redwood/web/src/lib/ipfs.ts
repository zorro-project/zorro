import {create} from 'ipfs-http-client'

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

// V1 cid to Infura URL
export const cidToUrl = (cid: string) => `https://${cid}.ipfs.infura-ipfs.io`

export default ipfsClient
