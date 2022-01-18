import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import ReviewPage from './ReviewPage'

export const Page = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{
      signUp: {
        photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
        video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
      },
    }}
  >
    <SignUpLayout>
      <ReviewPage />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/5. Review'}
