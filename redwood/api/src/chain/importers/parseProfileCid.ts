import {CID} from 'ipfs-http-client'
import {db} from 'src/lib/db'

export default async function parseProfileCid(cid: CID | null) {
  if (cid == null) return {}

  const serializedCid = cid.toV1().toString()

  try {
    const existingProfile = await db.cachedProfile.findFirst({
      where: {cid: serializedCid},
    })
    if (existingProfile)
      return {
        videoCid: existingProfile.videoCid,
        photoCid: existingProfile.photoCid,
      }

    const data = await (
      await fetch(`https://${serializedCid}.ipfs.infura-ipfs.io`)
    ).json()

    return {videoCid: data.video, photoCid: data.photo}
  } catch (e) {
    console.log(`Failed to read from CID ${cid.toString()}`)
    return {videoCid: null, photoCid: null}
  }
}
