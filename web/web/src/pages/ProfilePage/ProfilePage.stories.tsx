import ProfilePage from './ProfilePage'
import { ProfilePageQuery, ProfilePageQueryVariables } from 'types/graphql'
import { merge } from 'lodash'
import { PartialDeep } from 'type-fest'

const baseMock: ProfilePageQuery = {
  cachedProfile: {
    id: '1',
    ethereumAddress: '0x327e8ae4f9d6cca061ee8c05dc728b9545c2ac78',
    photoCID: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
    videoCID: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
    status: 'NOT_CHALLENGED',
    submissionTimestamp: '1970-01-02T10:17:36.789Z',
    __typename: 'CachedProfile',
  },
}

const mockQuery = (overrides: PartialDeep<ProfilePageQuery> = {}) => {
  mockGraphQLQuery(
    'ProfilePageQuery',
    (variables: ProfilePageQueryVariables, { ctx, req }): ProfilePageQuery =>
      merge(baseMock, overrides)
  )
}

export const Not_Challenged = () => {
  mockQuery()
  return <ProfilePage id="not_challenged" />
}

export const Challenged = () => {
  mockQuery({ cachedProfile: { status: 'CHALLENGED' } })
  return <ProfilePage id="challenged" />
}

export default { title: 'Pages/ProfilePage' }
