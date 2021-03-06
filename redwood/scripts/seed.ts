import syncStarknetState from '$api/src/tasks/syncStarknetState'
import {db} from 'api/src/lib/db'
import dayjs from 'dayjs'

/* eslint-disable no-console */

export default async () => {
  console.log('Seeding registration attempts')

  const notary = await db.user.create({
    data: {
      ethereumAddress: '0x18445eb5aaac66025fF4937385daC271E2b46982',
      email: 'kyle@example.com',
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
        createdAt: dayjs().subtract(8, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        approved: true,
        reviewedAt: new Date(),
        reviewedById: notary.id,
        createdAt: dayjs().subtract(7, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(6, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(5, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(4, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(4, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(4, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(4, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(4, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(3, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(2, 'hour').toDate(),
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0xae10064Aa785805Effbc21e8392d06322b272Ac9',
        createdAt: dayjs().subtract(1, 'hour').toDate(),
      },
    ],
  })

  await syncStarknetState()
}
