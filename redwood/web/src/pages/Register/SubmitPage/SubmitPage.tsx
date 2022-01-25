import {Spacer, Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {Button, Image, Stack} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import React, {useCallback} from 'react'
import ReactPlayer from 'react-player'
import {useUser} from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {useGuard} from 'src/lib/useGuard'
import {dataUrlToBlob, isLocalUrl, maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'
import {requireWalletConnected} from '../guards'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const SubmitPage = ({initialSubmitProgress = -1}) => {
  const {unsubmittedProfile, refetch: refetchUser} = useUser()
  const ethereumAddress = requireWalletConnected()

  const [submitProgress, setSubmitProgress] = React.useState(
    initialSubmitProgress
  )
  const submitting = submitProgress >= 0
  const registerState = useAppSelector((state) => state.register)
  const dispatch = useAppDispatch()

  useGuard(registerState.photo && registerState.video, routes.registerPhoto())

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
    dispatch(registerSlice.actions.resetForm())
    navigate(routes.registerPhoto())
  }, [])

  const submit = React.useCallback(async () => {
    setSubmitProgress(0)

    const photoBlob = isLocalUrl(registerState.photo)
      ? await dataUrlToBlob(registerState.photo!)
      : null
    const videoBlob = isLocalUrl(registerState.video)
      ? await dataUrlToBlob(registerState.video!)
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
      : registerState.photo!

    const videoCid = videoBlob
      ? (
          await ipfsClient.add(videoBlob, {
            progress: (bytes) => reportProgress(bytes + (photoBlob?.size ?? 0)),
          })
        ).cid
          .toV1()
          .toString()
      : registerState.video!

    await updateMutation({
      variables: {
        ethereumAddress,
        input: {
          photoCid,
          videoCid,
        },
      },
    })

    await refetchUser()
    navigate(routes.registerSubmitted())
  }, [ethereumAddress, updateMutation])

  return (
    <Stack spacing="6" flex="1" width="100%">
      <RegisterLogo />
      <Title title={submitting ? 'Uploading video' : 'Ready to submit'} />
      {submitting ? (
        <CircularProgress
          size="6rem"
          value={submitProgress}
          color="purple.500"
          alignSelf="center"
          py={12}
        />
      ) : (
        <>
          <Stack direction="row">
            <UserMediaBox flex="1">
              <Image src={maybeCidToUrl(registerState.photo)} />
            </UserMediaBox>
            <UserMediaBox flex="1">
              <ReactPlayer
                url={maybeCidToUrl(registerState.video)}
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
        </>
      )}
      <Spacer />

      <Button variant="register-primary" onClick={submit} disabled={submitting}>
        {unsubmittedProfile ? 'Resubmit application' : 'Submit application'}
      </Button>
      <Button
        variant="register-secondary"
        onClick={startOver}
        disabled={submitting}
      >
        Start over
      </Button>
    </Stack>
  )
}

export default SubmitPage
