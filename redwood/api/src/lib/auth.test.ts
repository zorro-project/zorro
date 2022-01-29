import dayjs from 'dayjs'
import {getCurrentUser} from './auth'
import {db} from './db'

describe('getCurrentUser', () => {
  it('finds users with valid sessions', async () => {
    const user = await db.user.create({
      data: {
        ethereumAddress: '0x123',
      },
    })
    await db.userSession.createMany({
      data: [
        {
          userId: user.id,
          token: 'current_session_token',
          expiresAt: dayjs().add(1, 'day').toDate(),
        },
        {
          userId: user.id,
          token: 'expired_session_token',
          expiresAt: dayjs().subtract(1, 'day').toDate(),
        },
      ],
    })

    const currentUser = await getCurrentUser(null, {
      token: 'current_session_token',
    })
    expect(currentUser?.id).toBe(user.id)
    const expiredUser = await getCurrentUser(null, {
      token: 'expired_session_token',
    })
    expect(expiredUser).toBe(null)
  })
})
