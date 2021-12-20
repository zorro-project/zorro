import ProfilePage from './ProfilePage'
import { ProfilePageQuery, ProfilePageQueryVariables } from 'types/graphql'

mockGraphQLQuery(
  'ProfilePageQuery',
  (variables: ProfilePageQueryVariables, { ctx, req }): ProfilePageQuery => {
    console.log('MOCK ProfilePageQuery', variables)
    return {
      cachedProfile: {
        id: '1',
        ethereumAddress: '0x327e8ae4f9d6cca061ee8c05dc728b9545c2ac78',
        photoCID: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
        videoCID: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
        status: 'submitted_via_notary',
        submissionTimestamp: '1970-01-02T10:17:36.789Z',
        __typename: 'CachedProfile',
      },
    }
  }
)

export const standard = () => {
  return <ProfilePage id="standard" />
}

export default { title: 'Pages/ProfilePage' }
