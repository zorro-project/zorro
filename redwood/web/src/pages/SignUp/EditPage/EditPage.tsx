import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl, FormHelperText, FormLabel} from '@chakra-ui/form-control'
import {Heading, Stack, StackDivider, Text} from '@chakra-ui/layout'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags, useQuery} from '@redwoodjs/web'
import {useContext, useEffect} from 'react'
import {Card} from 'src/components/Card'
import UserContext from 'src/layouts/UserContext'
import PhotoField from 'src/pages/SignUp/PhotoField'
import VideoField from 'src/pages/SignUp/VideoField'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {signUpSlice} from 'src/state/signUpSlice'
import {SignupEditPageQuery} from 'types/graphql'
import ProfileStatus from '../ProfileStatus'

const EditPage = () => {
  const {photo, video} = useAppSelector((state) => state.signUp)
  const dispatch = useAppDispatch()
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  const isValid = photo != null && video != null

  const {data} = useQuery<SignupEditPageQuery>(
    gql`
      query SignupEditPageQuery($ethereumAddress: ID!) {
        unsubmittedProfile(ethereumAddress: $ethereumAddress) {
          photoCid
          videoCid
          hasEmail
          ethereumAddress
          UnaddressedFeedback {
            feedback
          }
        }
      }
    `,
    {variables: {ethereumAddress}}
  )

  useEffect(() => {
    data?.unsubmittedProfile?.photoCid &&
      dispatch(signUpSlice.actions.setPhoto(data.unsubmittedProfile.photoCid))
    data?.unsubmittedProfile?.videoCid &&
      dispatch(signUpSlice.actions.setVideo(data.unsubmittedProfile.videoCid))
  }, [data?.unsubmittedProfile?.photoCid, data?.unsubmittedProfile?.videoCid])

  return (
    <Stack spacing="6">
      <MetaTags title="Create Public Profile" />
      <Heading size="lg">Create Public Profile</Heading>
      <Text>
        Your Zorro profile is linked to your real identity, and each person can
        only create a single profile. If you already have a Zorro profile,
        switch to that wallet.
      </Text>
      {data?.unsubmittedProfile && (
        <ProfileStatus profile={data.unsubmittedProfile} />
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
          disabled={!isValid}
          onClick={() => navigate(routes.signUpPresubmit())}
        >
          Continue
        </Button>
      </ButtonGroup>
    </Stack>
  )
}

export default EditPage
