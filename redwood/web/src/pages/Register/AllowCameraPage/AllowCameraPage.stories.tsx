import {StoryMocks} from 'src/lib/StoryMocks'
import RegisterLayout from '../RegisterLayout'
import AllowCameraPage from './AllowCameraPage'

export const Page = () => (
  <StoryMocks user={{user: {id: 1}}}>
    <RegisterLayout>
      <AllowCameraPage />
    </RegisterLayout>
  </StoryMocks>
)

export default {title: 'Pages/Register/3. Allow Camera'}
