import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import RecordPage from './RecordPage'

export const Take_Photo = () => (
  <StoryMocks user={{ethereumAddress: '0x456'}}>
    <SignUpLayout>
      <RecordPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Start_Recording = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{signUp: {photo: 'test'}}}
  >
    <SignUpLayout>
      <RecordPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Recording_Started = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{signUp: {photo: 'test'}}}
  >
    <SignUpLayout>
      <RecordPage mockRecording={true} />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/4. Record'}
