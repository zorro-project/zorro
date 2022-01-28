import {Wallet} from 'ethers'
import {getCurrentUser} from 'src/lib/auth'
import {db} from 'src/lib/db'
import {requestSessionAuthString, requestSessionToken} from './users'

describe('auth', () => {
  it('round-trips a successful login', async () => {
    const wallet = await Wallet.createRandom()

    const authString = await requestSessionAuthString({
      ethereumAddress: wallet.address,
    })

    expect(authString).toMatch(/^Sign this message to authenticate yourself/)
    expect(authString).toMatch(new RegExp(wallet.address))

    let user = await db.user.findUnique({
      where: {ethereumAddress: wallet.address},
    })
    expect(user?.sessionAuthString).toBe(authString)

    const signature = await wallet.signMessage(authString)

    const token = await requestSessionToken({
      ethereumAddress: wallet.address,
      signature,
    })
    expect(token).toBeTruthy()

    user = await db.user.findUnique({where: {ethereumAddress: wallet.address}})
    expect(user?.sessionAuthString).toBe(null)

    const currentUser = await getCurrentUser(null, {token: token!})
    expect(currentUser!.id).toEqual(user!.id)
  })
})
