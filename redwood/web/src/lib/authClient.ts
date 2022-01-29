import {AuthClient} from '@redwoodjs/auth/dist/authClients'

const TOKEN_KEY = 'ZORRO_AUTH_TOKEN'

const getToken = async () => localStorage.getItem(TOKEN_KEY)

const authClient: AuthClient = {
  type: 'custom',
  client: 'custom',

  getToken,
  getUserMetadata: getToken,

  login: async ({token}: {token: string}) =>
    localStorage.setItem(TOKEN_KEY, token),
  logout: async () => localStorage.removeItem(TOKEN_KEY),
  signup: () => {},
}

export default authClient
