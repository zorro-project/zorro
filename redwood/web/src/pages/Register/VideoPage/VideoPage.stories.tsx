import {StoryMocks} from 'src/lib/StoryMocks'
import RegisterLayout from '../RegisterLayout'
import VideoPage from './VideoPage'

export const Start_Recording = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{register: {photo: 'test'}}}
  >
    <RegisterLayout>
      <VideoPage />
    </RegisterLayout>
  </StoryMocks>
)

export const Recording_Started = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{register: {photo: 'test'}}}
  >
    <RegisterLayout>
      <VideoPage mockRecording={true} />
    </RegisterLayout>
  </StoryMocks>
)

export const Review = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{
      register: {
        photo: 'test',

        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <RegisterLayout>
      <VideoPage />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/5. Video'}
