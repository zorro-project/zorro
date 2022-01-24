import {StoryMocks} from 'src/lib/StoryMocks'
import RegisterLayout from '../RegisterLayout'
import EmailPage from './EmailPage'

export const Page = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{register: {photo: 'test', video: 'test'}}}
  >
    <RegisterLayout>
      <EmailPage />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/6. Email'}
