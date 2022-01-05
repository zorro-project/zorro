import {useLazyQuery} from '@apollo/client'
import {useEthers} from '@usedapp/core'
import {UserContextQuery, UserContextQueryVariables} from 'types/graphql'

type UserContextType = {
  ethereumAddress?: string
  unsubmittedProfile?: UserContextQuery['unsubmittedProfile']
  cachedProfile?: UserContextQuery['cachedProfileByEthereumAddress']
}

const UserContext = React.createContext<UserContextType>({})

export function UserContextProvider({children}: {children: React.ReactNode}) {
  const ethers = useEthers()

  const [queryUser, {data}] = useLazyQuery<
    UserContextQuery,
    UserContextQueryVariables
  >(
    gql`
      query UserContextQuery($ethereumAddress: ID!) {
        unsubmittedProfile(ethereumAddress: $ethereumAddress) {
          id
          ethereumAddress
          photoCid
          videoCid
        }

        cachedProfileByEthereumAddress(ethereumAddress: $ethereumAddress) {
          id
          ethereumAddress
        }
      }
    `,
    {variables: {ethereumAddress: ethers.account}}
  )

  React.useEffect(() => {
    if (ethers.account) {
      queryUser({variables: {ethereumAddress: ethers.account}})
    }
  }, [ethers.account])

  const context: UserContextType = {
    ethereumAddress: ethers.account,
    unsubmittedProfile: data?.unsubmittedProfile,
    cachedProfile: data?.cachedProfileByEthereumAddress,
  }

  return <UserContext.Provider value={context}>{children}</UserContext.Provider>
}

export default UserContext
