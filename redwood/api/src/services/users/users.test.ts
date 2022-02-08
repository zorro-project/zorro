import dayjs from 'dayjs'
import {Wallet} from 'ethers'
import {getCurrentUser} from 'src/lib/auth'
import {db} from 'src/lib/db'
import {requestSessionToken} from './users'

describe('auth', () => {
  it('round-trips a successful login', async () => {
    const wallet = await Wallet.createRandom()

    const expiresAt = dayjs().add(1, 'days').toISOString()

    const signature = await wallet.signMessage(expiresAt)

    const token = await requestSessionToken({
      ethereumAddress: wallet.address,
      expiresAt: expiresAt,
      signature,
    })
    expect(token).toBeTruthy()

    const currentUser = await getCurrentUser(null, {token: token!})
    const sessionUser = await db.user.findUnique({
      where: {ethereumAddress: wallet.address},
    })

    expect(currentUser!.user!.id).toEqual(sessionUser!.id)
  })

  it("Doesn't provide session tokens for invalid signatures", async () => {
    const wallet = await Wallet.createRandom()
    const expiresAt = dayjs().add(1, 'days').toISOString()
    const signature = await wallet.signMessage(expiresAt)

    expect(
      requestSessionToken({
        ethereumAddress: wallet.address,
        expiresAt: expiresAt,
        signature: signature.slice(0, -1),
      })
    ).rejects.toThrow()
  })

  it("Doesn't provide session tokens for dates too far in the future", async () => {
    const wallet = await Wallet.createRandom()
    const expiresAt = dayjs().add(17, 'days').toISOString()
    const signature = await wallet.signMessage(expiresAt)

    expect(
      await requestSessionToken({
        ethereumAddress: wallet.address,
        expiresAt: expiresAt,
        signature,
      })
    ).toBeNull()
  })
})
