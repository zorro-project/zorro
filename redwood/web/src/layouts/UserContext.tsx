import {useMutation} from '@apollo/client'
import {useTimeout} from '@chakra-ui/react'
import {AuthContextInterface, useAuth} from '@redwoodjs/auth'
import dayjs from 'dayjs'
import {Wallet} from 'ethers'
import {entropyToMnemonic, keccak256} from 'ethers/lib/utils'
import {useCallback, useEffect, useState} from 'react'
import {RequestSessionToken, RequestSessionTokenVariables} from 'types/graphql'
import useAsyncEffect from 'use-async-effect'
import useLocalStorageState from 'use-local-storage-state'
import {useAccount, useSignMessage} from 'wagmi'
import {ClientCurrentUser} from '../../../api/src/lib/auth'

export type UserContextType = {
  onAuthenticate: () => Promise<void>

  // Returns true if Redwood auth is fetching the user data from the server.
  // Will be true right after the initial pageload, and also right after the
  // user signs the authentication string until the request returns.
  loading: boolean

  // The redwood `AuthContext`, useful for refetching the user.
  auth: AuthContextInterface

  // We also return all the fields from the `CurrentUser` type for convenience.
} & (ClientCurrentUser | undefined)

const UserContext = React.createContext<UserContextType>({} as UserContextType)

const AUTH_STRING_TO_SIGN =
  'Only sign this message if you initiated an action with Zorro'

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const [account, disconnect] = useAccount()
  const rwAuth = useAuth()

  // We use this to determine if the user has changed the connected wallet, in
  // which case we invalidate the session.
  const [addressCache, setAddressCache] = useLocalStorageState<{
    connectedAddress: string
    derivedAddress: string
  } | null>('UserContext_addressCache', null)

  const requestSessionToken = useMutation<
    RequestSessionToken,
    RequestSessionTokenVariables
  >(gql`
    mutation RequestSessionToken(
      $ethereumAddress: String!
      $expiresAt: String!
      $signature: String!
    ) {
      requestSessionToken(
        ethereumAddress: $ethereumAddress
        expiresAt: $expiresAt
        signature: $signature
      )
    }
  `)

  const [signedMessage, signMessage] = useSignMessage({
    message: AUTH_STRING_TO_SIGN,
  })

  // This function uses a signed string from the user's connected wallet as the
  // entropy to create a new wallet. This ensures their existing wallet is not
  // tied to the identity we use for authentication with Zorro, and also acts as
  // a temporary credential.
  // It can throw errors, which the caller should handle.
  const onAuthenticate = useCallback(async () => {
    if (!account.data?.address)
      throw new Error('No account connected, please reconnect and try again')

    const walletSeedSignature = await signMessage()
    if (walletSeedSignature.error) throw walletSeedSignature.error

    const wallet = await Wallet.fromMnemonic(
      entropyToMnemonic(keccak256(walletSeedSignature.data))
    )

    const expiresAt = dayjs().add(14, 'days').toISOString()
    const sessionTokenSignature = await wallet.signMessage(expiresAt)

    const sessionTokenRequest = await requestSessionToken[0]({
      variables: {
        ethereumAddress: wallet.address,
        expiresAt,
        signature: sessionTokenSignature,
      },
    })

    if (sessionTokenRequest.errors)
      throw new Error(
        sessionTokenRequest.errors.map((e) => e.message).join(', ')
      )
    await rwAuth.logIn({
      token: sessionTokenRequest.data?.requestSessionToken,
    })
    setAddressCache({
      connectedAddress: account.data?.address,
      derivedAddress: wallet.address,
    })
  }, [signMessage])

  const [initialLoadTimeoutExpired, setInitialLoadTimeoutExpired] =
    useState(false)
  useTimeout(() => setInitialLoadTimeoutExpired(true), 1000)

  // When the connected address changes (because the user disconnected, switched
  // accounts, or we just can't read from MetaMask), we need to invalidate the
  // existing session.
  useAsyncEffect(async () => {
    // This is an ugly hack since ethers.js doesn't tell you whether `account`
    // is undefined because the page just loaded, or undefined because the user
    // has disconnected their account. So we just assume that the account the
    // user last connected with is still the currently account, and check in
    // after a second to see if that's true.
    if (!initialLoadTimeoutExpired) return

    if (addressCache?.connectedAddress !== account.data?.address) {
      await rwAuth.logOut()
      setAddressCache(null)
    }
  }, [account.data?.address, initialLoadTimeoutExpired, rwAuth.logOut])

  // If the user's auth has expired or been revoked by the server, make the
  // connect button appear as disconnected to avoid confusion. If they click
  // "Connect Wallet" while in this state, it'll ask them to sign the auth
  // string.
  useEffect(() => {
    if (!rwAuth.currentUser && !rwAuth.loading) {
      setAddressCache(null)
      disconnect()
    }
  }, [rwAuth.currentUser, rwAuth.loading])

  const context = {
    onAuthenticate,
    auth: rwAuth,
    loading:
      signedMessage.loading || requestSessionToken[1].loading || rwAuth.loading,
    ...(rwAuth.currentUser as ClientCurrentUser | undefined),
  } as UserContextType

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export const useUser = () => React.useContext(UserContext)

export default UserContext
