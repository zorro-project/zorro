import ProfilePage from './ProfilePage'
import {ProfilePageQuery, ProfilePageQueryVariables} from 'types/graphql'
import {merge} from 'lodash'
import {PartialDeep} from 'type-fest'

const baseMock: ProfilePageQuery = {
  cachedProfile: {
    id: '12345',
    ethereumAddress: '0x334230242d318b5ca159fc38e07dc1248b7b35e4',
    status: 'NOT_CHALLENGED',
    isVerified: true,
    CID: 'bafybeg4qt5n7szznmtbsr63bs3aaik23vrc2ptuctm5bmgqynq',
    photoCID: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
    videoCID: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
    submissionTimestamp: '2021-01-02T10:17:36.789Z',
    notarized: true,
    challengeTimestamp: null,
    challengerAddress: null,
    challengeEvidenceCID: null,
    ownerEvidenceCID: null,
    adjudicationTimestamp: null,
    adjudicatorEvidenceCID: null,
    didAdjudicatorVerifyProfile: false,
    appealTimestamp: null,
    superAdjudicationTimestamp: null,
    didSuperAdjudicatorVerifyProfile: false,
    __typename: 'CachedProfile',
  },
}

const challengedMock: ProfilePageQuery = merge({}, baseMock, {
  cachedProfile: {
    status: 'CHALLENGED',
    isVerified: false,
    challengeTimestamp: '2021-05-02T10:17:36.789Z',
    ethereumAddress: '0xe07dc1248b7b35e4334230242d318b5ca159fc38',
    challengeEvidenceCID: 'bafybeg4qt5n7szznmtbsr63bs3aaik23vrc2ptuctm5bmgqynq',
  },
})

const adjudicationRoundCompletedMock: ProfilePageQuery = merge(
  {},
  challengedMock,
  {
    cachedProfile: {
      status: 'ADJUDICATION_ROUND_COMPLETED',
      adjudicationTimestamp: '2021-05-02T11:17:36.789Z',
      adjudicationEvidenceCID:
        'bafybeg4qt5n7szznmtbsr63bs3aaik23vrc2ptuctm5bmgqynq',
      didAdjudicatorVerifyProfile: true,
      isVerified: true,
    },
  }
)

const appealedMock: ProfilePageQuery = merge(
  {},
  adjudicationRoundCompletedMock,
  {
    cachedProfile: {
      status: 'APPEALED',
      appealTimestamp: '2021-05-03T12:17:36.789Z',
    },
  }
)

const superAdjudicationRoundCompletedMock: ProfilePageQuery = merge(
  {},
  appealedMock,
  {
    cachedProfile: {
      status: 'SUPER_ADJUDICATION_ROUND_COMPLETED',
      superAdjudicationTimestamp: '2021-05-14T13:17:36.789Z',
      didSuperAdjudicatorVerifyProfile: false,
      isVerified: false,
    },
  }
)

const settledMock: ProfilePageQuery = merge(
  {},
  superAdjudicationRoundCompletedMock,
  {cachedProfile: {status: 'SETTLED'}}
)

const mockQuery = (response: ProfilePageQuery) => {
  mockGraphQLQuery(
    'ProfilePageQuery',
    (variables: ProfilePageQueryVariables, {ctx, req}): ProfilePageQuery =>
      response
  )
}

export const Not_Challenged = () => {
  mockQuery(baseMock)
  return <ProfilePage id="12345" />
}

export const Challenged = () => {
  mockQuery(challengedMock)
  return <ProfilePage id="12345" />
}

export const Adjudication_Round_Completed = () => {
  mockQuery(adjudicationRoundCompletedMock)
  return <ProfilePage id="12345" />
}

export const Appealed = () => {
  mockQuery(appealedMock)
  return <ProfilePage id="12345" />
}

export const Super_Adjudication_Round_Completed = () => {
  mockQuery(superAdjudicationRoundCompletedMock)
  return <ProfilePage id="12345" />
}

export const Settled = () => {
  mockQuery(settledMock)
  return <ProfilePage id="12345" />
}

export default {title: 'Pages/ProfilePage'}
