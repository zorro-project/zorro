import {useLazyQuery} from '@apollo/client'
import {useTimeout} from '@chakra-ui/react'
import {getAddress} from 'ethers/lib/utils'
import {useState} from 'react'
import {UserContextQuery, UserContextQueryVariables} from 'types/graphql'
import useLocalStorageState from 'use-local-storage-state'
import {useAccount} from 'wagmi'

export type UserContextType =
  | ({
      ethereumAddress: string
      refetch: () => void
      loading: boolean
    } & UserContextQuery)
  | Record<string, undefined>

const UserContext = React.createContext<UserContextType>({})

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const [account] = useAccount()

  const [ethereumAddress, setEthereumAddress] = useLocalStorageState<
    string | undefined
  >('UserContext_ethereumAddress', undefined)

  // This is an ugly hack since ethers.js doesn't tell you whether `account` is
  // undefined because the page just loaded, or undefined because the user has
  // disconnected their account. So we just assume that the account the user
  // last connected with is still the currently account, and check in after a
  // second to see if that's true.
  const [initialLoadTimeoutExpired, setInitialLoadTimeoutExpired] =
    useState(false)
  useTimeout(() => setInitialLoadTimeoutExpired(true), 1000)

  const [queryUser, userContextQuery] = useLazyQuery<
    UserContextQuery,
    UserContextQueryVariables
  >(
    gql`
      query UserContextQuery($ethereumAddress: ID!) {
        user(ethereumAddress: $ethereumAddress) {
          id
          hasEmail
        }

        unsubmittedProfile(ethereumAddress: $ethereumAddress) {
          id
        }

        cachedProfile: cachedProfileByEthereumAddress(
          ethereumAddress: $ethereumAddress
        ) {
          id
        }
      }
    `
  )

  React.useEffect(() => {
    if (initialLoadTimeoutExpired) {
      setEthereumAddress(
        account.data?.address ? getAddress(account.data?.address) : undefined
      )
    }
  }, [account.data?.address, initialLoadTimeoutExpired, setEthereumAddress])

  React.useEffect(() => {
    if (ethereumAddress) queryUser({variables: {ethereumAddress}})
  }, [ethereumAddress, queryUser])

  let context = {} as UserContextType

  if (ethereumAddress) {
    context = {
      ethereumAddress,
      refetch: userContextQuery.refetch,
      loading: userContextQuery.loading,
      ...userContextQuery.data,
    } as UserContextType
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export const useUser = () => React.useContext(UserContext)

export default UserContext
