import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import EmailPage from './EmailPage'

export const Page = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{signUp: {photo: 'test', video: 'test'}}}
  >
    <SignUpLayout>
      <EmailPage />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/6. Email'}
