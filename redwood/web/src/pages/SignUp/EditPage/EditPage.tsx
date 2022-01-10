import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl, FormHelperText, FormLabel} from '@chakra-ui/form-control'
import {Heading, Stack, StackDivider, Text} from '@chakra-ui/layout'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext} from 'react'
import {useFormContext} from 'react-hook-form'
import {Card} from 'src/components/Card'
import PhotoField from 'src/pages/SignUp/PhotoField'
import ProfileStatus from 'src/pages/SignUp/ProfileStatus'
import VideoField from 'src/pages/SignUp/VideoField'
import {SignUpContext} from '../SignUpContext'

const EditPage = () => {
  const {formState} = useFormContext()
  const {
    data: {unsubmittedProfile},
  } = useContext(SignUpContext)

  return (
    <Stack spacing="6">
      <MetaTags title="Create Public Profile" />
      <Heading size="lg">Create Public Profile</Heading>
      <Text>
        Your Zorro profile is linked to your real identity, and each person can
        only create a single profile. If you already have a Zorro profile,
        switch to that wallet.
      </Text>
      {!formState.isDirty && unsubmittedProfile && (
        <ProfileStatus profile={unsubmittedProfile} />
      )}
      <Card>
        <Stack divider={<StackDivider />} spacing="8">
          <Stack
            direction={{base: 'column', md: 'row'}}
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
            direction={{base: 'column', md: 'row'}}
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
          colorScheme="purple"
          disabled={!formState.isValid}
          onClick={() => navigate(routes.signUpPresubmit())}
        >
          Continue
        </Button>
      </ButtonGroup>
    </Stack>
  )
}

export default EditPage
