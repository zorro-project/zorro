import {useMutation} from '@apollo/client'
import {useTimeout} from '@chakra-ui/react'
import {AuthContextInterface, useAuth} from '@redwoodjs/auth'
import dayjs from 'dayjs'
import {Wallet} from 'ethers'
import {entropyToMnemonic, getAddress, keccak256} from 'ethers/lib/utils'
import {useCallback, useEffect, useState} from 'react'
import {RequestSessionToken, RequestSessionTokenVariables} from 'types/graphql'
import useAsyncEffect from 'use-async-effect'
import useLocalStorageState from 'use-local-storage-state'
import {useAccount, useConnect, useSigner} from 'wagmi'
import {ClientCurrentUser} from '../../../api/src/lib/auth'

export type UserContextType = {
  // The `connectedAddress` is the address that is both connected and
  // authenticated. If the address is either not connected, or not
  // authenticated, this will return `undefined`. Note that this is **NOT** the
  // address associated with the profiles on-chain, because that one is derived
  // from string the user uses this address to sign.
  connectedAddress?: string

  // Returns true if the user is in the process either of connecting their
  // wallet or signing the string to authenticate it.
  isAuthenticating: boolean
  onConnectButtonPressed: () => Promise<void>

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
  const [account] = useAccount()
  const rwAuth = useAuth()

  // This is set once the account is both connected and authenticated.
  const [connectedAddress, setConnectedAddress] = useLocalStorageState<
    string | undefined
  >('UserContext_connectedAddress', undefined)

  // This is just for future-proofing to make it more more possible to move
  // away from redwood sessions in the future if we want without making everyone
  // sign in again to see their profile. It has an awkward name on purpose.
  // Don't rely on this unless it's to migrate away from redwood sessions.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [unusedDerivedAddress, setUnusedDerivedAddress] = useLocalStorageState<
    string | undefined
  >('UserContext_unusedDerivedAddress', undefined)

  // Set when we're
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const [requestSessionToken] = useMutation<
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

  const [_, getSigner] = useSigner()

  // This function uses a signed string from the user's connected wallet as the
  // entropy to create a new wallet. This ensures their existing wallet is not
  // tied to the identity we use for authentication with Zorro, and also acts as
  // a temporary credential.
  const maybeAuthenticate = useCallback(
    async (newAddress) => {
      setIsAuthenticating(true)

      const address = getAddress(newAddress)
      const signer = await getSigner()

      try {
        if (!signer)
          return alert('Could not detect signer, is Metamask installed?')
        const walletSeedSignature = await signer.signMessage(
          AUTH_STRING_TO_SIGN
        )

        const wallet = await Wallet.fromMnemonic(
          entropyToMnemonic(keccak256(walletSeedSignature))
        )

        const expiresAt = dayjs().add(14, 'days').toISOString()
        const sessionTokenSignature = await wallet.signMessage(expiresAt)

        const sessionTokenRequest = await requestSessionToken({
          variables: {
            ethereumAddress: wallet.address,
            expiresAt,
            signature: sessionTokenSignature,
          },
        })

        if (!sessionTokenRequest.data) return alert('requestSessionToken error')
        if (!sessionTokenRequest.data.requestSessionToken)
          return alert(
            'error signing in, contact support in the Zorro discord!'
          )
        await rwAuth.logIn({
          token: sessionTokenRequest.data?.requestSessionToken,
        })
        setConnectedAddress(address)
        setUnusedDerivedAddress(wallet.address)
      } finally {
        setIsAuthenticating(false)
      }
    },
    [getSigner]
  )

  const [{data: connectors, loading: isConnecting}, connect] = useConnect()
  const onConnectButtonPressed = useCallback(async () => {
    setIsAuthenticating(true)
    try {
      if (account.data?.address) {
        // If you're already connected and you can still press the button, we must
        // need your signature to authenticate the address.
        await maybeAuthenticate(account.data.address)
      } else {
        await connect(connectors.connectors[0])
      }
    } finally {
      setIsAuthenticating(false)
    }
  }, [maybeAuthenticate, connect])

  const [initialLoadTimeoutExpired, setInitialLoadTimeoutExpired] =
    useState(false)
  useTimeout(() => setInitialLoadTimeoutExpired(true), 1000)

  // When the connected address changes (because the user disconnected, switched
  // accounts, or we just can't read from MetaMask), we need to invalidate the
  // existing session and, if a new account has been connected, authenticate
  // with the new account.
  useAsyncEffect(async () => {
    // This is an ugly hack since ethers.js doesn't tell you whether `account`
    // is undefined because the page just loaded, or undefined because the user
    // has disconnected their account. So we just assume that the account the
    // user last connected with is still the currently account, and check in
    // after a second to see if that's true.
    if (!initialLoadTimeoutExpired) return

    if (connectedAddress !== account.data?.address) {
      await rwAuth.logOut()
      if (account.data?.address && isAuthenticating)
        await maybeAuthenticate(account.data.address)
    }
  }, [account.data?.address, initialLoadTimeoutExpired, rwAuth.logOut])

  // If the user's auth has expired or been revoked by the server, make the
  // connect button appear as disconnected to avoid confusion. If they click
  // "Connect Wallet" while in this state, it'll ask them to sign the auth
  // string.
  useEffect(() => {
    if (!rwAuth.currentUser && !rwAuth.loading) setConnectedAddress(undefined)
  }, [rwAuth.currentUser, rwAuth.loading])

  const context = {
    connectedAddress,
    isAuthenticating:
      isAuthenticating || (isConnecting && initialLoadTimeoutExpired),
    onConnectButtonPressed,
    auth: rwAuth,
    loading: rwAuth.loading,
    ...(rwAuth.currentUser as ClientCurrentUser | undefined),
  } as UserContextType

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export const useUser = () => React.useContext(UserContext)

export default UserContext
