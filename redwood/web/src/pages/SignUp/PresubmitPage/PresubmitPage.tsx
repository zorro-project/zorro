import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl} from '@chakra-ui/form-control'
import {
  Box,
  Heading,
  ListItem,
  OrderedList,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags, useMutation} from '@redwoodjs/web'
import React, {useContext} from 'react'
import {Card} from 'src/components/Card'
import Identicon from 'src/components/Identicon'
import UserContext from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {dataUrlToBlob, isLocalUrl} from 'src/lib/util'
import PhotoField from 'src/pages/SignUp/PhotoField'
import VideoField from 'src/pages/SignUp/VideoField'
import {useAppSelector} from 'src/state/store'
import {
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'

const PreSubmitPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  const [submitProgress, setSubmitProgress] = React.useState(-1)
  const signUpState = useAppSelector((state) => state.signUp)

  const isValid = signUpState.photo != null && signUpState.video != null
  if (!isValid) return <Redirect to={routes.signUpEdit()} />

  const [updateMutation] = useMutation<
    UpdateUnsubmittedProfileMutation,
    UpdateUnsubmittedProfileMutationVariables
  >(gql`
    mutation UpdateUnsubmittedProfileMutation(
      $ethereumAddress: String!
      $input: UpdateUnsubmittedProfileInput!
    ) {
      updateUnsubmittedProfile(
        ethereumAddress: $ethereumAddress
        input: $input
      ) {
        id
      }
    }
  `)

  const onSubmit = React.useCallback(async () => {
    if (!isValid) return
    setSubmitProgress(0)

    const photoBlob = isLocalUrl(signUpState.photo)
      ? await dataUrlToBlob(signUpState.photo!)
      : null
    const videoBlob = isLocalUrl(signUpState.video)
      ? await dataUrlToBlob(signUpState.video!)
      : null

    const reportProgress = (bytes: number) =>
      setSubmitProgress(
        (100 * bytes) / ((photoBlob?.size ?? 0) + (videoBlob?.size ?? 0))
      )

    const photoCid = photoBlob
      ? (
          await ipfsClient.add(photoBlob, {
            progress: reportProgress,
          })
        ).cid
          .toV1()
          .toString()
      : signUpState.photo!

    const videoCid = videoBlob
      ? (
          await ipfsClient.add(videoBlob, {
            progress: reportProgress,
          })
        ).cid
          .toV1()
          .toString()
      : signUpState.video!

    await updateMutation({
      variables: {
        ethereumAddress,
        input: {
          photoCid,
          videoCid,
        },
      },
    })

    navigate(routes.signUpSubmitted())
  }, [ethereumAddress, updateMutation])

  return (
    <Stack spacing="6">
      <MetaTags title="Review Public Profile" />
      <Heading size="lg">Review Public Profile</Heading>
      <Card>
        <Stack divider={<StackDivider />} spacing="8">
          <Box>
            <Stack width="full" spacing="4">
              <Heading size="md">Ethereum Wallet</Heading>
              <Text>
                This wallet will be linked to your real identity, so use a new
                one or one you don't mind revealing publicly.
              </Text>
              <Stack direction="row" justify="center" align="center">
                <Text fontWeight="bold" display="block" wordBreak="break-all">
                  {ethereumAddress}
                </Text>
                <Identicon account={ethereumAddress} />
              </Stack>
            </Stack>
          </Box>

          <Stack
            direction={{base: 'column', md: 'row'}}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <Heading size="md">Selfie</Heading>
              <Text>Does your picture match the requirements?</Text>
              <OrderedList fontSize="sm">
                <ListItem>Taken from the front</ListItem>
                <ListItem>
                  <strong>whole face</strong> visible
                </ListItem>
                <ListItem>
                  Nothing covering face (glasses, mask, makeup)
                </ListItem>
              </OrderedList>
            </FormControl>
            <PhotoField readOnly />
          </Stack>
          <Stack
            direction={{base: 'column', md: 'row'}}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <Heading size="md">Video</Heading>
              <Text>Does your video match the requirements?</Text>
              <OrderedList fontSize="sm">
                <ListItem>Face fully visible</ListItem>
                <ListItem>Right hand raised</ListItem>
                <ListItem>
                  Repeat "I solemnly swear this is my first time registering a
                  Zorro profile"
                </ListItem>
              </OrderedList>
            </FormControl>
            <VideoField readOnly />
          </Stack>
        </Stack>
      </Card>
      {submitProgress >= 0 ? (
        <Stack align="center" justify="center" direction="row">
          <CircularProgress value={submitProgress} />
          <Text>Submitting...</Text>
        </Stack>
      ) : (
        <ButtonGroup alignSelf="flex-end">
          <Button onClick={() => navigate(routes.signUpRecord())}>
            Make Changes
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            disabled={!isValid}
            onClick={onSubmit}
          >
            Submit
          </Button>
        </ButtonGroup>
      )}
    </Stack>
  )
}

export default PreSubmitPage
