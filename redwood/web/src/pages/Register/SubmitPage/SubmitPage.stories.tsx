import {StoryMocks} from 'src/lib/StoryMocks'
import RegisterLayout from '../RegisterLayout'
import SubmitPage from './SubmitPage'

export const Unsubmitted = () => (
  <StoryMocks
    user={{ethereumAddress: '0x4567'}}
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

export const Resubmit = () => (
  <StoryMocks
    user={{ethereumAddress: '0x4567', registrationAttempt: {id: 1}}}
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
    user={{ethereumAddress: '0x4567'}}
    state={{register: {photo: 'test', video: 'test'}}}
  >
    <RegisterLayout>
      <SubmitPage initialSubmitProgress={23} />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/7. Submit'}
