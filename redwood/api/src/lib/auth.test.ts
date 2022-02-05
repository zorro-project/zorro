import dayjs, {Dayjs} from 'dayjs'
import {getCurrentUser, SessionData, SESSION_SECRET} from './auth'
import {db} from './db'
import Iron from '@hapi/iron'

const getToken = async (ethereumAddress: string, expiresAt: Dayjs) => {
  await db.user.upsert({
    where: {ethereumAddress},
    create: {ethereumAddress},
    update: {},
  })
  const data: SessionData = {
    ethereumAddress,
    expiresAt: expiresAt.toISOString(),
  }
  return await Iron.seal(data, SESSION_SECRET, Iron.defaults)
}

describe('getCurrentUser', () => {
  it('Finds users with a valid token', async () => {
    const currentUser = await getCurrentUser(null, {
      token: await getToken('0x456', dayjs().add(1, 'day')),
    })
    expect(currentUser?.ethereumAddress).toBe('0x456')
  })

  it('Does not find users with an invalid token', async () => {
    const currentUser = await getCurrentUser(null, {
      token: await getToken('0x456', dayjs().subtract(1, 'day')),
    })
    expect(currentUser).toBe(null)

    expect(await getCurrentUser(null, {token: '24'})).toBe(null)
  })
})
