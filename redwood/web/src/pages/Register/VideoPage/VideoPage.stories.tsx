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

export const Review_Vertical_Video = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{
      register: {
        photo: 'test',

        video:
          'https://ipfs.kleros.io/ipfs/QmVad3G9hmWRJofzpMhHAvERmxbcopYLJpnDacmBV62AFf/31825568-c209-4820-9a8a-250b9ea1d3fe.mp4',
      },
    }}
  >
    <RegisterLayout>
      <VideoPage />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/5. Video'}

// https://ipfs.kleros.io/ipfs/QmVad3G9hmWRJofzpMhHAvERmxbcopYLJpnDacmBV62AFf/31825568-c209-4820-9a8a-250b9ea1d3fe.mp4
