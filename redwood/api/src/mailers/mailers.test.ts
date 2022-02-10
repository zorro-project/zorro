import sendNotaryApproved from './sendNotaryApproved'
import sendNotaryFeedback from './sendNotaryFeedback'

describe('mailers', () => {
  test.skip('sendNotaryApproved', async () => {
    const email = await sendNotaryApproved(
      'kyle@example.com',
      '0xed2ece94cdca3dd3605dba4dc4240788f4dd6e29'
    )
    console.log(email)
  })
  test.skip('sendNotaryFeedback', async () => {
    await sendNotaryFeedback(
      'kyle@example.com',
      'video does not show your entire face'
    )
  })
})
