import {db} from 'src/lib/db'

// Add supported notification types here
type NotificationType = {
  type: 'NEW_CHALLENGE'
  profileId: number
  challengeTimestamp: string
}

// Only call the provided `notify` function if no existing notification with the
// same `key` has been created. This prevents us from sending the same
// notification multiple times.

export const maybeNotify = async (
  key: NotificationType,
  notify: () => unknown
) => {
  if ((await db.notification.count({where: {key: {equals: key}}})) > 0) return

  await notify()

  await db.notification.create({
    data: {
      key,
    },
  })
}
