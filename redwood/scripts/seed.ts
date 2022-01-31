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
        ethereumAddress: '0xae2C63F5EA082993eCf89E2977724727d47B6d7B',
        approved: true,
        reviewedAt: new Date(),
        reviewedById: notary.id,
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae33177093b30049461A868db85580BD8d69EC1a',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae4e70F3C1B990bD19c7D961Dc3035b0bafe75f9',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae5CA9aE10A566c4896B32691B9c80a223E295a4',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae6C8c3F5cB12B70C9D27473e076163B22d8b82f',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae731122e5C72D3cEDa26E4be03E79625EfBe472',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0xae82d35eDF5d4424D58537762613364511CD7d3A',
      },
    ],
  })

  await syncStarknetState()
}
