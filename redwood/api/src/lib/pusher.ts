import Pusher from 'pusher'

// TODO: Does Redwood have a way to set different env variables in dev vs test?
// We should just unset the `PUSHER_APP_ID` in test probably.
export const pusher =
  process.env.PUSHER_APP_ID && process.env.NODE_ENV !== 'test'
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY ?? '',
        secret: process.env.PUSHER_SECRET ?? '',
        cluster: process.env.PUSHER_CLUSTER ?? '',
        useTLS: true,
      })
    : null
