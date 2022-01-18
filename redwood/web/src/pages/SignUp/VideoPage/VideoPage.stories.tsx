import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import VideoPage from './VideoPage'

export const Start_Recording = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{signUp: {photo: 'test'}}}
  >
    <SignUpLayout>
      <VideoPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Recording_Started = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{signUp: {photo: 'test'}}}
  >
    <SignUpLayout>
      <VideoPage mockRecording={true} />
    </SignUpLayout>
  </StoryMocks>
)

export const Review = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{
      signUp: {
        photo: 'test',

        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <SignUpLayout>
      <VideoPage />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/4. Video'}
