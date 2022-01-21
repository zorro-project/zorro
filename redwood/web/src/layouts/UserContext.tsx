import {useLazyQuery} from '@apollo/client'
import {useTimeout} from '@chakra-ui/react'
import {useEthers} from '@usedapp/core'
import {useState} from 'react'
import {UserContextQuery, UserContextQueryVariables} from 'types/graphql'
import useLocalStorageState from 'use-local-storage-state'

export type UserContextType = {
  ethereumAddress?: string
  refetch: () => void
} & UserContextQuery

export const defaultValue = {refetch: () => {}}
const UserContext = React.createContext<UserContextType>(defaultValue)

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const ethers = useEthers()

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

  const [queryUser, {data, refetch}] = useLazyQuery<
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
      setEthereumAddress(ethers.account ?? undefined)
    }
  }, [ethers.account, initialLoadTimeoutExpired, setEthereumAddress])

  React.useEffect(() => {
    if (ethereumAddress) queryUser({variables: {ethereumAddress}})
  }, [ethereumAddress, queryUser])

  const context: UserContextType = {
    ethereumAddress,
    refetch,
    ...data,
  }

  // If we know we have a user, let's not render the page until we know who they are to avoid a flash.
  if (ethereumAddress && !data) return null

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
