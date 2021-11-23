import importPoH from 'api/db/seed/importPoH'
import { db } from 'api/src/lib/db'

/* eslint-disable no-console */

export default async () => {
  try {
    // await importPoH()

    console.log('Seeding unsubmitted profiles')
    await db.unsubmittedProfile.createMany({
      data: [
        {
          photoCID:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          videoCID:
            'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
          ethAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
          email: null,
          unaddressedFeedbackId: null,
        },
        {
          photoCID:
            'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
          videoCID:
            'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
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
        UnsubmittedProfile: { connect: { id: profile.id } },
        feedback: "You don't say the full required phrase in your video",
      },
    })

    await db.unsubmittedProfile.update({
      where: { id: feedback.unsubmittedProfileId },
      data: { unaddressedFeedbackId: feedback.id },
    })

    // TODO: how are we going to seed actual profiles? Push them to StarkNet first I guess?
    // const pohProfiles = await importPoH()

    // await db.cachedProfile.createMany({
    //   data: pohProfiles.map((profile) => ({
    //     ...profile,
    //     createdTimestamp: new Date(),
    //   })),
    // })
  } catch (error) {
    console.error(error)
  }
}