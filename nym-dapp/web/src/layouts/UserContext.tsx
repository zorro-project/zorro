import { useLazyQuery } from '@apollo/client'
import { useEthers } from '@usedapp/core'
import { UserContextQuery, UserContextQueryVariables } from 'types/graphql'

type UserContextType = {
  ethAddress?: string
  unsubmittedProfile?: UserContextQuery['unsubmittedProfile']
  cachedProfile?: UserContextQuery['cachedProfile']
}

const UserContext = React.createContext<UserContextType>({})

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const ethers = useEthers()

  const [queryUser, { data }] = useLazyQuery<
    UserContextQuery,
    UserContextQueryVariables
  >(
    gql`
      query UserContextQuery($ethAddress: ID!) {
        unsubmittedProfile(ethAddress: $ethAddress) {
          id
          ethAddress
        }

        cachedProfile(ethAddress: $ethAddress) {
          ethAddress
        }
      }
    `,
    { variables: { ethAddress: ethers.account } }
  )

  React.useEffect(() => {
    if (ethers.account) {
      queryUser({ variables: { ethAddress: ethers.account } })
    }
  }, [ethers.account])

  const context: UserContextType = {
    ethAddress: ethers.account,
    unsubmittedProfile: data?.unsubmittedProfile,
    cachedProfile: data?.cachedProfile,
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
