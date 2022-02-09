// To access your database
import {db} from '$api/src/lib/db'
import BN from 'bn.js'
import {mapValues} from 'lodash'

const hexToBN = (hex: string) => new BN(hex.replace('0x', ''), 16).toString(10)

// const OFFSET = 12

// The output of this command CANNOT be used in Cairo directly because it
// doesn't print the profile fields in the expected order.

export default async ({args}) => {
  if (!process.env.DATABASE_URL.includes('staging')) {
    throw new Error(
      'This script is intended to run against the staging database. Eg. \n`DATABASE_URL=postgres://staging_db_... yarn rw exportSeeds`'
    )
  }

  const profiles = await db.cachedProfile.findMany({orderBy: {id: 'asc'}})

  profiles.forEach((profile, _idx) => {
    console.log(hexToBN(profile.cid))

    //     const obj = mapValues(profile.cache as object, hexToBN)

    //     const serializedObject = Object.entries(obj)
    //       .map(([key, value]) => `${key}=${value}`)
    //       .join(',\n      ')

    //     console.log(`
    //     # TESTNET PROFILE #${profile.id} (https://testnet.zorro.xyz/profiles/${
    //       profile.id
    //     })
    //     assert profiles[${idx + OFFSET}] = Profile(
    //       ${serializedObject}
    //     )
    // `)
  })
}
