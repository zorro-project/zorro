// import { mapValues } from 'lodash'
// import { db } from 'src/lib/db'
// // import { Prisma } from '@prisma/client'
// import { exportProfileById, isInitialized } from 'src/lib/starknet'

// export default async function syncStarknetState(onlyNewProfiles = false) {
//   let currentId = new Prisma.Decimal(1)

//   if (onlyNewProfiles) {
//     currentId =
//       (await db.cachedProfile.aggregate({ _max: { profileId: true } }))._max
//         .profileId || currentId
//   }

//   // console.log(
//   //   'profile',
//   //   await db.cachedProfile.findFirst({ where: { profileId: 1 } })
//   // )

//   // while (true) {
//   // const profile = await exportProfileById(currentId)
//   // if (!isInitialized(profile.profile.address)) break

//   // console.log(profile)

//   // const profileFields = mapValues(
//   //   profile.profile,
//   //   (v) => new Prisma.Decimal(v)
//   // )
//   // console.log(profileFields)

//   // await db.random3.create({
//   //   data: { id: 1, feedback: 'test' },
//   // })
//   // break

//   // currentId = currentId.add(new Prisma.Decimal(1))
//   //   await db.cachedProfile.upsert({
//   //     where: { profileId: new Prisma.Decimal(1) },
//   //     create: {
//   //       profileId: currentId,
//   //       ...profileFields,
//   //     },
//   //     update: {
//   //       // ...profileFields,
//   //     },
//   //   })
//   //   console.log('upserted')
//   //   break
//   // }

//   console.log('sync complete')
// }

// // syncStarknetState()
