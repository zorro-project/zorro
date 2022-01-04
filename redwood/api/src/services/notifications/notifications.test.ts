import {db} from 'src/lib/db'
import {maybeNotify} from './notifications'

describe('maybeNotify', () => {
  test('does not notify if a notification already exists', async () => {
    const notifyPrevious = jest.fn()
    await db.notification.create({
      data: {
        key: {
          type: 'NEW_CHALLENGE',
          profileId: 1,
          challengeTimestamp: '2022-01-01T00:00:00Z',
        },
      },
    })
    await maybeNotify(
      {
        type: 'NEW_CHALLENGE',
        challengeTimestamp: '2022-01-01T00:00:00Z',
        profileId: 1,
      },
      notifyPrevious
    )

    expect(notifyPrevious).not.toHaveBeenCalled()

    const notifyCurrent = jest.fn()

    await maybeNotify(
      {
        type: 'NEW_CHALLENGE',
        challengeTimestamp: '2022-01-02T00:00:00Z',
        profileId: 1,
      },
      notifyCurrent
    )
    expect(notifyCurrent).toHaveBeenCalled()
  })
})
