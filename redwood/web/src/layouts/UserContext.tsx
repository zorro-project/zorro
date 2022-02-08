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
import {CurrentUser} from '../../../api/src/lib/auth'

export type UserContextType = {
  isAuthenticating: boolean
  onConnectButtonPressed: () => Promise<void>
  connectedAddress?: string
  loading: boolean
  auth: AuthContextInterface
} & (CurrentUser | undefined)

const UserContext = React.createContext<UserContextType>({} as UserContextType)

const AUTH_STRING_TO_SIGN =
  'Sign this string to generate your Zorro authentication credentials. Only sign it if a trusted party asks you to, because your signature can be used to impersonate you on Zorro.'

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const [account] = useAccount()
  const rwAuth = useAuth()

  // The address that is both connected and authenticated.
  const [connectedAddress, setConnectedAddress] = useLocalStorageState<
    string | undefined
  >('UserContext_connectedAddress', undefined)

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
  // entropy to create a new wallet. This ensures their public identity is not
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

  useAsyncEffect(async () => {
    // This is an ugly hack since ethers.js doesn't tell you whether `account`
    // is undefined because the page just loaded, or undefined because the user
    // has disconnected their account. So we just assume that the account the
    // user last connected with is still the currently account, and check in
    // after a second to see if that's true.
    if (!initialLoadTimeoutExpired) return

    // If the connected address doesn't match the address we last stored, they
    // must have signed out of MetaMask or changed accounts. We need to try to
    // reauthenticate them.
    if (connectedAddress !== account.data?.address) {
      await rwAuth.logOut()
      if (account.data?.address) await maybeAuthenticate(account.data.address)
    }
  }, [account.data?.address, initialLoadTimeoutExpired, rwAuth.logOut])

  // If the user's auth has expired or been revoked, disconnect their wallet to
  // avoid confusion.
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
    ...(rwAuth.currentUser as CurrentUser | undefined),
  } as UserContextType

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export const useUser = () => React.useContext(UserContext)

export default UserContext
