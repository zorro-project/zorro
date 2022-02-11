import {api} from '@pagerduty/pdjs'

const pd = process.env.PAGERDUTY_TOKEN
  ? api({token: process.env.PAGERDUTY_TOKEN})
  : null

export const alertNotaries = async (message: string) => {
  if (pd) {
    pd.post('/incidents', {
      headers: {
        From: 'kyle@zorrofoundation.org',
      },
      data: {
        incident: {
          type: 'incident',
          title: message,
          urgency: 'high',
          service: {
            id: 'P7A2OTK',
            type: 'service_reference',
          },
        },
      },
    })
  } else {
    console.log('Would send alert', message)
  }
}

// alertNotaries('7 new profiles to review')
