import {StoryMocks} from 'src/lib/StoryMocks'
import RegisterLayout from '../RegisterLayout'
import SubmitPage from './SubmitPage'

export const Unsubmitted = () => (
  <StoryMocks
    user={{user: {ethereumAddress: '0x1234'}}}
    state={{
      register: {
        photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <RegisterLayout>
      <SubmitPage />
    </RegisterLayout>
  </StoryMocks>
)

export const Unsumbitted_Vertical_Video = () => (
  <StoryMocks
    user={{user: {ethereumAddress: '0x1234'}}}
    state={{
      register: {
        photo:
          'https://ipfs.kleros.io/ipfs/QmZkijLi6wvNsxwn9NEs6geUKi3geeocL9o9WU1TddTDmi/photo5170237719635405227.jpg',
        video:
          'https://ipfs.kleros.io/ipfs/QmVad3G9hmWRJofzpMhHAvERmxbcopYLJpnDacmBV62AFf/31825568-c209-4820-9a8a-250b9ea1d3fe.mp4',
      },
    }}
  >
    <RegisterLayout>
      <SubmitPage />
    </RegisterLayout>
  </StoryMocks>
)

export const Resubmit = () => (
  <StoryMocks
    user={{
      user: {ethereumAddress: '0x1234'},
      registrationAttempt: {id: 1},
    }}
    state={{
      register: {
        photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <RegisterLayout>
      <SubmitPage />
    </RegisterLayout>
  </StoryMocks>
)

export const Submitting = () => (
  <StoryMocks
    user={{user: {ethereumAddress: '0x1234'}}}
    state={{register: {photo: 'test', video: 'test'}}}
  >
    <RegisterLayout>
      <SubmitPage initialSubmitProgress={23} />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/7. Submit'}
