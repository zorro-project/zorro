import syncStarknetState from '$api/src/tasks/syncStarknetState'
import {db} from 'api/src/lib/db'

/* eslint-disable no-console */

export default async () => {
  console.log('Seeding registration attempts')

  const notary = await db.user.create({
    data: {
      ethereumAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
      email: 'test@test.com',
      roles: ['NOTARY'],
    },
  })

  await db.user.create({
    data: {
      ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
      email: 'user@test.com',
    },
  })

  await db.registrationAttempt.createMany({
    data: [
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        approved: false,
        reviewedAt: new Date(),
        reviewedById: notary.id,
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        approved: true,
        reviewedAt: new Date(),
        reviewedById: notary.id,
      },
    ],
  })

  await syncStarknetState()
}
