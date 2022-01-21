import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import PhotoPage from './PhotoPage'

export const Take_Photo = () => (
  <StoryMocks user={{ethereumAddress: '0x456'}}>
    <SignUpLayout>
      <PhotoPage />
    </SignUpLayout>
  </StoryMocks>
)

export const Review = () => (
  <StoryMocks
    user={{ethereumAddress: '0x456'}}
    state={{
      signUp: {
        photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
      },
    }}
  >
    <SignUpLayout>
      <PhotoPage />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/4. Photo'}
