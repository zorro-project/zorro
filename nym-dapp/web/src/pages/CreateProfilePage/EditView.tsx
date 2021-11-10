import { Button, ButtonGroup } from '@chakra-ui/button'
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control'
import { Heading, Stack, StackDivider, Text } from '@chakra-ui/layout'
import { useFormContext } from 'react-hook-form'
import { Card } from 'src/components/Card'
import PhotoField from 'src/pages/CreateProfilePage/PhotoField'
import VideoField from 'src/pages/CreateProfilePage/VideoField'
import { FindUnsubmittedProfileQuery } from 'types/graphql'
import ProfileStatus from './ProfileStatus'

const EditView = (props: {
  onContinue: () => void
  unsubmittedProfile: FindUnsubmittedProfileQuery['unsubmittedProfile']
}) => {
  const { formState } = useFormContext()

  return (
    <Stack spacing="6">
      <Heading size="lg">Create Public Profile</Heading>
      <Text>
        Your Nym profile is linked to your real identity, and each person can
        only create a single profile. If you already have a Nym profile, switch
        to that wallet.
      </Text>
      {!formState.isDirty && (
        <ProfileStatus profile={props.unsubmittedProfile} />
      )}
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
            <PhotoField />
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
      <ButtonGroup alignSelf="flex-end">
        <Button
          colorScheme="teal"
          disabled={!formState.isValid}
          onClick={props.onContinue}
        >
          Continue
        </Button>
      </ButtonGroup>
    </Stack>
  )
}

export default EditView
