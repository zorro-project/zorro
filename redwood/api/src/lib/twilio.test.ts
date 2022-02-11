import {NOTARY_PHONE_NUMBERS} from './protocolNotifications'
import {makeCall} from './twilio'

describe('makeCall', () => {
  test.skip('calls the notaries', async () => {
    await makeCall(
      NOTARY_PHONE_NUMBERS,
      '23 Zorro registrations awaiting review.'
    )
  })
})
