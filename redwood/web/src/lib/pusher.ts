import Pusher from 'pusher-js'
import {useEffect} from 'react'

const pusher = new Pusher(process.env.PUSHER_KEY, {
  cluster: process.env.PUSHER_CLUSTER,
})

export const usePusher = (
  channel: string,
  event: string,
  callback: Function
) => {
  useEffect(() => {
    const pusherChannel = pusher.subscribe(channel)
    pusherChannel.bind(event, callback)
    return () => {
      pusherChannel.unbind(event, callback)
      pusherChannel.unbind_all()
      pusher.unsubscribe(channel)
    }
  }, [channel, event, callback])
}
