// To access your database
import {db} from '$api/src/lib/db'
import BN from 'bn.js'
import {mapValues} from 'lodash'

const hexToBN = (hex: string) => new BN(hex.replace('0x', ''), 16).toString(10)

export default async ({args}) => {
  const profiles = await db.cachedProfile.findMany()

  profiles.forEach((profile) => {
    console.log(
      `\n\nPROFILE #${profile.id} (http://localhost:8910/profiles/${profile.id})`
    )

    const obj = mapValues(profile.cache as object, hexToBN)
    const serializedObject = Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join(',\n      ')

    console.log(`
    Profile(
      ${serializedObject}
    )

`)
  })
}
