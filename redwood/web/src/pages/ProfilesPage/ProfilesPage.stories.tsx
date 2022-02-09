import {ProfilesPageQuery} from 'types/graphql'
import ProfilesPage from './ProfilesPage'

const baseMock: ProfilesPageQuery = {
  optimisticallyApprovedRegs: [
    {
      __typename: 'RegistrationAttempt',
      ethereumAddress: '0x2Fd1c0659F721ddD06bCeff288B408187C0BB105',
      photoCid: 'bafybeifph3xf6l2sdpasjszm5glnvtdmk2inz7syjtfok353e56oexlfeu',
      reviewedAt: '2022-01-28T17:47:26.319Z',
    },
    {
      __typename: 'RegistrationAttempt',
      ethereumAddress: '0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC74',
      photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
      reviewedAt: '2022-01-28T17:47:57.656Z',
    },
  ],
  cachedProfiles: {
    id: '1',
    edges: [
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x327e8AE4F9D6CcA061EE8C05dC728b9545C2aC74',
          photoCid:
            'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
          submissionTimestamp: '2022-01-28T17:54:26.000Z',
          id: '13',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x00000000000000000000000000000002Dd656804',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '12',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x00000000000000000000000000000002Dd656803',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '11',
          isVerified: false,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956F0cd',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '10',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956F0Cc',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '9',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956F0cb',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '8',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956F0cA',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '7',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956f0C9',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '6',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956f0C8',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '5',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956f0C7',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '4',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x000000000000000000000000000000004956f0c6',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '3',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x0000000000000000000000000000000007557E7B',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '2',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
      {
        node: {
          __typename: 'CachedProfile',
          ethereumAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
          photoCid:
            'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
          submissionTimestamp: '2022-01-28T09:15:22.000Z',
          id: '1',
          isVerified: true,
        },
        __typename: 'CachedProfileEdge',
      },
    ],
    pageInfo: {endCursor: '1', hasNextPage: false, __typename: 'PageInfo'},
    count: 13,
    __typename: 'CachedProfileConnection',
  },
}

export const Page = () => {
  mockGraphQLQuery('ProfilesPageQuery', baseMock)
  return <ProfilesPage />
}

export default {title: 'Pages/ProfilesPage'}
