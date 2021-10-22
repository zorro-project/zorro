/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

dotenv.config()
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('Seeding unsubmitted profiles')
  const profiles = await db.unsubmittedProfile.createMany({
    data: [
      {
        selfieCID:
          'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        videoCID: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
        ethAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
        email: null,
        unaddressedFeedbackId: null,
      },
      {
        selfieCID:
          'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCID: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        ethAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC78',
        email: 'test@test.com',
      },
    ],
    skipDuplicates: true,
  })

  console.log('Seeding notary feedback')
  const profile = await db.unsubmittedProfile.findUnique({
    where: { ethAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4' },
  })
  const feedback = await db.notaryFeedback.create({
    data: {
      unsubmittedProfileId: profile.id,
      feedback: "You don't say the full required phrase in your video",
    },
  })

  await db.unsubmittedProfile.update({
    where: { id: feedback.unsubmittedProfileId },
    data: { unaddressedFeedbackId: feedback.id },
  })
  // // Change to match your data model and seeding needs
  // const data = [
  //   { name: 'alice', email: 'alice@example.com' },
  //   { name: 'mark', email: 'mark@example.com' },
  //   { name: 'jackie', email: 'jackie@example.com' },
  //   { name: 'bob', email: 'bob@example.com' },
  // ]

  // // Note: if using PostgreSQL, using `createMany` to insert multiple records is much faster
  // // @see: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
  // return Promise.all(
  //   data.map(async (user) => {
  //     const record = await db.user.create({
  //       data: { name: user.name, email: user.email },
  //     })
  //     console.log(record)
  //   })
  // )
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await db.$disconnect()
  })
