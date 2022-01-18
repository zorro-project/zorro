import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import SubmitPage from './SubmitPage'

export const Unsubmitted = () => (
  <StoryMocks
    user={{ethereumAddress: '0x4567'}}
    state={{
      signUp: {
        photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <SignUpLayout>
      <SubmitPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Submitting = () => (
  <StoryMocks
    user={{ethereumAddress: '0x4567'}}
    state={{signUp: {photo: 'test', video: 'test'}}}
  >
    <SignUpLayout>
      <SubmitPage initialSubmitProgress={23} />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/6. Submit'}
