import Pusher from 'pusher'

export const pusher = process.env.PUSHER_APP_ID
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY ?? '',
      secret: process.env.PUSHER_SECRET ?? '',
      cluster: process.env.PUSHER_CLUSTER ?? '',
      useTLS: true,
    })
  : null
