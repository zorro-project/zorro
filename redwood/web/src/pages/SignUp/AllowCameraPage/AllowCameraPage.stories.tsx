import {StoryMocks} from 'src/lib/StoryMocks'
import SignUpLayout from '../SignUpLayout'
import AllowCameraPage from './AllowCameraPage'

export const Page = () => (
  <StoryMocks>
    <SignUpLayout>
      <AllowCameraPage />
    </SignUpLayout>
  </StoryMocks>
)

export default {title: 'Pages/Sign Up/3. Allow Camera'}
