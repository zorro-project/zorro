import {useLazyQuery} from '@apollo/client'
import {useTimeout} from '@chakra-ui/react'
import {useEthers} from '@usedapp/core'
import {useState} from 'react'
import {UserContextQuery, UserContextQueryVariables} from 'types/graphql'
import useLocalStorageState from 'use-local-storage-state'

type UserContextType =
  | ({
      ethereumAddress: string
    } & UserContextQuery)
  | null

const UserContext = React.createContext<UserContextType>(null)

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const ethers = useEthers()

  const [ethereumAddress, setEthereumAddress] = useLocalStorageState<
    string | null
  >('UserContext_ethereumAddress', null)

  // This is an ugly hack since ethers.js doesn't tell you whether `account` is
  // undefined because the page just loaded, or undefined because the user has
  // disconnected their account. So we just assume that the account the user
  // last connected with is still the currently account, and check in after a
  // second to see if that's true.
  const [initialLoadTimeoutExpired, setInitialLoadTimeoutExpired] =
    useState(false)
  useTimeout(() => setInitialLoadTimeoutExpired(true), 1000)

  const [queryUser, {data}] = useLazyQuery<
    UserContextQuery,
    UserContextQueryVariables
  >(
    gql`
      query UserContextQuery($ethereumAddress: ID!) {
        unsubmittedProfile(ethereumAddress: $ethereumAddress) {
          id
        }

        cachedProfile: cachedProfileByEthereumAddress(
          ethereumAddress: $ethereumAddress
        ) {
          id
        }
      }
    `,
    {variables: {ethereumAddress}}
  )

  React.useEffect(() => {
    if (initialLoadTimeoutExpired) {
      setEthereumAddress(ethers.account ?? null)
    }
  }, [ethers.account, initialLoadTimeoutExpired, setEthereumAddress])

  React.useEffect(() => {
    if (ethereumAddress) queryUser({variables: {ethereumAddress}})
  }, [ethereumAddress, queryUser])

  const context: UserContextType = {
    ethereumAddress,
    ...data,
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
