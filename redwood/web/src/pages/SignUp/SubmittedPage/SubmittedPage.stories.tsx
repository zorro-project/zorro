import {StoryMocks} from 'src/lib/StoryMocks'
import {SignUpSubmittedPageQuery} from 'types/graphql'
import SignUpLayout from '../SignUpLayout'
import SubmittedPage from './SubmittedPage'

const mockQuery = (response: SignUpSubmittedPageQuery) => {
  mockGraphQLQuery(
    'SignUpSubmittedPageQuery',
    (): SignUpSubmittedPageQuery => response
  )
}

export const Unviewed = () => {
  mockQuery({
    user: {id: '2', hasEmail: true},
    unsubmittedProfile: {
      id: 3,
      ethereumAddress: '0x136E68D01324D5E183FAE06713f8295b8B4D9C2a',
      UnaddressedFeedback: null,
    },
  })

  return (
    <StoryMocks
      user={{ethereumAddress: '0x4567'}}
      state={{signUp: {photo: 'test', video: 'test'}}}
    >
      <SignUpLayout>
        <SubmittedPage />
      </SignUpLayout>
    </StoryMocks>
  )
}

export default {title: 'Pages/Sign Up/7. Submitted'}
