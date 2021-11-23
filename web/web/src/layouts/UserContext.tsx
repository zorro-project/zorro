import { useLazyQuery } from '@apollo/client'
import { useEthers } from '@usedapp/core'
import { UserContextQuery, UserContextQueryVariables } from 'types/graphql'

type UserContextType = {
  address?: string
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
      query UserContextQuery($address: ID!) {
        unsubmittedProfile(address: $address) {
          id
          address
        }

        cachedProfile(address: $address) {
          address
        }
      }
    `,
    { variables: { address: ethers.account } }
  )

  React.useEffect(() => {
    if (ethers.account) {
      queryUser({ variables: { address: ethers.account } })
    }
  }, [ethers.account])

  const context: UserContextType = {
    address: ethers.account,
    unsubmittedProfile: data?.unsubmittedProfile,
    cachedProfile: data?.cachedProfile,
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
