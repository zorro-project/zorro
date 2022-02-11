import {castArray} from 'lodash'
import twilio from 'twilio'

const mockCalls = !['production', 'staging'].includes(
  process.env.CHAIN_DEPLOYMENT
)

const client = mockCalls
  ? null
  : twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

export const sendMessage = async (to: string | string[], body: string) => {
  const message = {
    body,
    from: process.env.TWILIO_NUMBER || '+15555555555',
  }
  if (!client) {
    console.log('Would send', {to, ...message})
  } else {
    const toArray = castArray(to)
    await Promise.all(
      toArray.map((to) => client.messages.create({to, ...message}))
    )
  }
}

export const makeCall = async (to: string | string[], text: string) => {
  const message = {
    twiml: `<Response><Say>${text}</Say></Response>`,
    from: process.env.TWILIO_NUMBER || '+15555555555',
  }
  if (!client) {
    console.log('Would make call', {to, ...message})
    return []
  } else {
    const toArray = castArray(to)
    return Promise.all(
      toArray.map((to) =>
        client.calls.create({
          to,
          ...message,
        })
      )
    )
  }
}
