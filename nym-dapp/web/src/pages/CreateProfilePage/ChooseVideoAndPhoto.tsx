import {
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import { Card } from 'src/components/Card'
import SelfieField from 'src/pages/CreateProfilePage/SelfieField'
import VideoField from 'src/pages/CreateProfilePage/VideoField'

const EditView = () => {
  return (
    <Stack spacing="6">
      <Heading size="lg">Create Public Profile</Heading>
      <Text>
        Your Nym profile is linked to your real identity, and each person can
        only create a single profile. If you already have a Nym profile, switch
        to that wallet.
      </Text>
      <Card>
        <Stack divider={<StackDivider />} spacing="8">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <FormLabel>Selfie</FormLabel>
              <FormHelperText>
                We need a picture of you to make sure you're a unique human.
              </FormHelperText>
            </FormControl>
            <SelfieField />
          </Stack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <FormLabel>Video</FormLabel>
              <FormHelperText>
                Recording a video makes it harder for bots to get into the
                registry.
              </FormHelperText>
            </FormControl>
            <VideoField />
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}

export default EditView
