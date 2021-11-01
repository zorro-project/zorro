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
  const [ethAddress, setEthAddress] = React.useState<string | undefined>()

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
    { variables: { ethAddress }, fetchPolicy: 'cache-and-network' }
  )

  React.useEffect(() => {
    console.log('ethers reload', ethers.account)
    if (ethers.account) {
      setEthAddress(ethers.account)
      queryUser({ variables: { ethAddress: ethers.account } })
    }
  }, [ethers.account])

  // React.useEffect(() => {}
  //   if (loading) return;

  // ), [data, loading])

  const context: UserContextType = {
    ethAddress,
    unsubmittedProfile: data?.unsubmittedProfile,
    cachedProfile: data?.cachedProfile,
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
