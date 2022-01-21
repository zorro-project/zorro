import {Flex, Spacer, Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {Image, Stack, Button} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import React, {useCallback, useContext} from 'react'
import ReactPlayer from 'react-player'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {useNav, dataUrlToBlob, isLocalUrl} from 'src/lib/util'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'
import SignUpLogo from '../SignUpLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const SubmitPage = ({initialSubmitProgress = -1}) => {
  const {ethereumAddress, unsubmittedProfile} = useContext(UserContext)
  if (!ethereumAddress) return useNav(routes.signUpIntro(), {replace: true})

  const [submitProgress, setSubmitProgress] = React.useState(
    initialSubmitProgress
  )
  const submitting = submitProgress >= 0
  const signUpState = useAppSelector((state) => state.signUp)
  const dispatch = useAppDispatch()

  if (signUpState.photo == null || signUpState.video == null)
    return useNav(routes.signUpPhoto(), {replace: true})

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

  const startOver = useCallback(() => {
    dispatch(signUpSlice.actions.setPhoto(undefined))
    dispatch(signUpSlice.actions.setVideo(undefined))
    navigate(routes.signUpPhoto())
  }, [])

  const submit = React.useCallback(async () => {
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
            progress: (bytes) => reportProgress(bytes + (photoBlob?.size ?? 0)),
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
    <Stack spacing="6" flex="1" width="100%">
      <SignUpLogo />
      <Title title={submitting ? 'Uploading video' : 'Ready to submit'} />
      {submitting ? (
        <Flex flex="1" alignItems="center" justifyContent="center">
          <CircularProgress
            size="6rem"
            value={submitProgress}
            color="purple.500"
          />
        </Flex>
      ) : (
        <>
          <Stack direction="row">
            <UserMediaBox flex="1">
              <Image src={maybeCidToUrl(signUpState.photo)} />
            </UserMediaBox>
            <UserMediaBox flex="1">
              <ReactPlayer
                url={maybeCidToUrl(signUpState.video)}
                controls
                width="100%"
                height="100%"
              />
            </UserMediaBox>
          </Stack>

          <Text>
            A volunteer community notary will verify your application in
            real-time.
          </Text>
          <Spacer />
        </>
      )}
      <Button variant="signup-primary" onClick={submit} disabled={submitting}>
        {unsubmittedProfile ? 'Resubmit application' : 'Submit application'}
      </Button>
      <Button
        variant="signup-secondary"
        onClick={startOver}
        disabled={submitting}
      >
        Start over
      </Button>
    </Stack>
  )
}

export default SubmitPage
