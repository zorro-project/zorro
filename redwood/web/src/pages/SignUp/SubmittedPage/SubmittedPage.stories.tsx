import dayjs from 'dayjs'
import {merge} from 'lodash'
import {StoryMocks} from 'src/lib/StoryMocks'
import {PartialDeep} from 'type-fest'
import {SignUpSubmittedPageQuery} from 'types/graphql'
import SignUpLayout from '../SignUpLayout'
import SubmittedPage from './SubmittedPage'

const mockQuery = (query: PartialDeep<SignUpSubmittedPageQuery>) => {
  const baseMock: SignUpSubmittedPageQuery = {
    user: {id: '2', hasEmail: true},
    unsubmittedProfile: {
      id: 3,
      ethereumAddress: '0x136E68D01324D5E183FAE06713f8295b8B4D9C2a',
      photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
      videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      lastSubmittedAt: dayjs().toISOString(),
      notaryViewedAt: null,
      notaryApprovedAt: null,
      UnaddressedFeedback: null,
      __typename: 'UnsubmittedProfile',
    },
    cachedProfile: null,
  }

  mockGraphQLQuery(
    'SignUpSubmittedPageQuery',
    (): SignUpSubmittedPageQuery => merge({}, baseMock, query)
  )
}

const user = {ethereumAddress: '0x136E68D01324D5E183FAE06713f8295b8B4D9C2a'}

const state = {
  signUp: {
    photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
    video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
  },
}

const Page = () => (
  <StoryMocks user={user} state={state}>
    <SignUpLayout>
      <SubmittedPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Unviewed = () => {
  mockQuery({})

  return <Page />
}

export const Notary_Viewed = () => {
  mockQuery({
    unsubmittedProfile: {notaryViewedAt: dayjs().toISOString()},
  })

  return <Page />
}

export const Notary_Approved = () => {
  mockQuery({
    unsubmittedProfile: {notaryApprovedAt: dayjs().toISOString()},
  })

  return <Page />
}

export const Notary_Feedback = () => {
  mockQuery({
    unsubmittedProfile: {
      UnaddressedFeedback: {
        feedback:
          'The left side of your face is not visible through the entire video',
      },
    },
  })

  return <Page />
}

export const Success = () => {
  mockQuery({cachedProfile: {id: '3'}})
  return <Page />
}

export const Timeout_With_Email = () => {
  mockQuery({
    unsubmittedProfile: {
      lastSubmittedAt: dayjs().subtract(1, 'day').toISOString(),
    },
  })
  return <Page />
}

export const Timeout_No_Email = () => {
  mockQuery({
    user: null,
    unsubmittedProfile: {
      lastSubmittedAt: dayjs().subtract(1, 'day').toISOString(),
    },
  })
  return <Page />
}

export default {title: 'Pages/Sign Up/8. Submitted'}
