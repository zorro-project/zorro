import {merge} from 'lodash'
import {ProfilePageQuery} from 'types/graphql'
import ProfilePage from './ProfilePage'

const baseMock: ProfilePageQuery = {
  cachedProfile: {
    id: '12345',
    ethereumAddress: '0x334230242d318b5ca159fc38e07dc1248b7b35e4',
    currentStatus: 'NOT_CHALLENGED',
    isVerified: true,
    cid: 'bafybeg4qt5n7szznmtbsr63bs3aaik23vrc2ptuctm5bmgqynq',
    photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
    videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
    submissionTimestamp: '2021-01-02T10:17:36.789Z',
    notarized: true,
    challengeTimestamp: null,
    challengerAddress: null,
    challengeEvidenceCid: null,
    ownerEvidenceCid: null,
    adjudicationTimestamp: null,
    adjudicatorEvidenceCid: null,
    didAdjudicatorVerifyProfile: false,
    appealTimestamp: null,
    appealId: null,
    superAdjudicationTimestamp: null,
    didSuperAdjudicatorOverturnAdjudicator: false,
    __typename: 'CachedProfile',
  },
}

const challengedMock: ProfilePageQuery = merge({}, baseMock, {
  cachedProfile: {
    currentStatus: 'CHALLENGED',
    isVerified: false,
    challengeTimestamp: '2021-05-02T10:17:36.789Z',
    ethereumAddress: '0xe07dc1248b7b35e4334230242d318b5ca159fc38',
    challengeEvidenceCid: 'bafybeg4qt5n7szznmtbsr63bs3aaik23vrc2ptuctm5bmgqynq',
  },
})

const adjudicationRoundCompletedMock: ProfilePageQuery = merge(
  {},
  challengedMock,
  {
    cachedProfile: {
      currentStatus: 'ADJUDICATION_ROUND_COMPLETED',
      adjudicationTimestamp: '2021-05-02T11:17:36.789Z',
      adjudicationEvidencecid:
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
      currentStatus: 'APPEALED',
      appealTimestamp: '2021-05-03T12:17:36.789Z',
      appealId: 3,
    },
  }
)

const superAdjudicationRoundCompletedMock: ProfilePageQuery = merge(
  {},
  appealedMock,
  {
    cachedProfile: {
      currentStatus: 'SUPER_ADJUDICATION_ROUND_COMPLETED',
      superAdjudicationTimestamp: '2021-05-14T13:17:36.789Z',
      didSuperAdjudicatorOverturnAdjudicator: false,
      isVerified: false,
    },
  }
)

const settledMock: ProfilePageQuery = merge(
  {},
  superAdjudicationRoundCompletedMock,
  {cachedProfile: {currentStatus: 'SETTLED'}}
)

const mockQuery = (response: ProfilePageQuery) => {
  mockGraphQLQuery('ProfilePageQuery', (): ProfilePageQuery => response)
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
