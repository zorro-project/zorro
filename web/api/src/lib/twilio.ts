import { castArray } from 'lodash'
import twilio from 'twilio'

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

export const sendMessage = async (to: string | string[], body: string) => {
  const message = {
    body,
    from: process.env.TWILIO_NUMBER || '+15555555555',
  }
  if (process.env.NODE_ENV === 'production') {
    const toArray = castArray(to)
    await Promise.all(
      toArray.map((to) => client.messages.create({ to, ...message }))
    )
  } else {
    console.log('Would send', { to, ...message })
  }
}
