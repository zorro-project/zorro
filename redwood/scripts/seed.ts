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
        ethereumAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
        approved: false,
        reviewedAt: new Date(),
        reviewedById: notary.id,
      },
      {
        photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethereumAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e5',
        approved: true,
        reviewedAt: new Date(),
        reviewedById: notary.id,
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC78',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC71',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC72',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC73',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC74',
      },
      {
        photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC75',
      },
    ],
  })

  await syncStarknetState()
}
