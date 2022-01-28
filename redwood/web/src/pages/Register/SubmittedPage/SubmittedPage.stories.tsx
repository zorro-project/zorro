import dayjs from 'dayjs'
import {merge} from 'lodash'
import {StoryMocks} from 'src/lib/StoryMocks'
import {PartialDeep} from 'type-fest'
import {RegisterSubmittedPageQuery} from 'types/graphql'
import RegisterLayout from '../RegisterLayout'
import SubmittedPage from './SubmittedPage'

const mockQuery = (query: PartialDeep<RegisterSubmittedPageQuery>) => {
  const baseMock: RegisterSubmittedPageQuery = {
    user: {id: '2', hasEmail: true},
    registrationAttempt: {
      id: 3,
      ethereumAddress: '0x136E68D01324D5E183FAE06713f8295b8B4D9C2a',
      photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
      videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      createdAt: dayjs().toISOString(),
      __typename: 'RegistrationAttempt',
    },
    cachedProfile: null,
  }

  mockGraphQLQuery(
    'RegisterSubmittedPageQuery',
    (): RegisterSubmittedPageQuery => merge({}, baseMock, query)
  )
}

const user = {ethereumAddress: '0x136E68D01324D5E183FAE06713f8295b8B4D9C2a'}

const state = {
  register: {
    photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
    video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
  },
}

const Page = () => (
  <StoryMocks user={user} state={state}>
    <RegisterLayout>
      <SubmittedPage />
    </RegisterLayout>
  </StoryMocks>
)

export const Unviewed = () => {
  mockQuery({})

  return <Page />
}

export const Notary_Viewed = () => {
  mockQuery({
    registrationAttempt: {notaryViewedAt: dayjs().toISOString()},
  })

  return <Page />
}

export const Notary_Approved = () => {
  mockQuery({
    registrationAttempt: {
      approved: true,
      reviewedAt: dayjs().toISOString(),
    },
  })

  return <Page />
}

export const Notary_Feedback = () => {
  mockQuery({
    registrationAttempt: {
      reviewedAt: dayjs().toISOString(),
      approved: false,
      deniedReason:
        'The left side of your face is not visible through the entire video',
    },
  })

  return <Page />
}

export const Timeout_With_Email = () => {
  mockQuery({
    registrationAttempt: {
      createdAt: dayjs().subtract(1, 'day').toISOString(),
    },
  })
  return <Page />
}

export const Timeout_No_Email = () => {
  mockQuery({
    user: null,
    registrationAttempt: {
      createdAt: dayjs().subtract(1, 'day').toISOString(),
    },
  })
  return <Page />
}

export const Citizenship_Active = () => {
  mockQuery({cachedProfile: {id: '3'}})
  return <Page />
}

export default {title: 'Pages/Register/8. Submitted'}
