import {Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {Image, Stack} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import React, {FC, useCallback} from 'react'
import {useUser} from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {useGuard} from 'src/lib/useGuard'
import {dataUrlToBlob, isLocalUrl, maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {AttemptRegistration, AttemptRegistrationVariables} from 'types/graphql'
import {
  requireNoExistingProfile,
  requireAuthenticated,
} from '../../../lib/guards'
import UserMediaBox from '../UserMediaBox'
import MinimalVideoPlayer from 'src/components/MinimalVideoPlayer'
import RegisterScreen from '../RegisterScreen'
import {track} from 'src/lib/posthog'

const SubmitPage: FC<{initialSubmitProgress?: number}> = ({
  initialSubmitProgress = -1,
}) => {
  requireNoExistingProfile()
  requireAuthenticated()

  const {registrationAttempt, auth, user} = useUser()

  const [submitProgress, setSubmitProgress] = React.useState(
    initialSubmitProgress
  )
  const submitting = submitProgress >= 0
  const registerState = useAppSelector((state) => state.register)
  const dispatch = useAppDispatch()

  useGuard(registerState.photo && registerState.video, routes.registerPhoto())

  const [attemptRegistrationMutation] = useMutation<
    AttemptRegistration,
    AttemptRegistrationVariables
  >(gql`
    mutation AttemptRegistration($input: AttemptRegistrationInput!) {
      attemptRegistration(input: $input) {
        id
      }
    }
  `)

  const startOver = useCallback(() => {
    track('registration started over')
    dispatch(registerSlice.actions.resetForm())
    navigate(routes.registerPhoto())
  }, [])

  if (!user) return null
  const submit = useCallback(async () => {
    track('registration submitted')

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

    await attemptRegistrationMutation({
      variables: {
        input: {
          ethereumAddress: user?.ethereumAddress,
          photoCid,
          videoCid,
        },
      },
    })

    await auth.reauthenticate()
    navigate(routes.registerSubmitted())
  }, [user?.ethereumAddress, attemptRegistrationMutation])

  return (
    <RegisterScreen
      title={submitting ? 'Uploading video' : 'Ready to submit'}
      buttonDescription={
        !submitting && (
          <Text>
            Note that all applications are public so they can be reviewed by the
            Zorro community.
          </Text>
        )
      }
      primaryButtonLabel={
        registrationAttempt ? 'Resubmit application' : 'Submit application'
      }
      primaryButtonProps={{onClick: submit, disabled: submitting}}
      secondaryButtonLabel="Start over"
      secondaryButtonProps={{onClick: startOver, disabled: submitting}}
    >
      {submitting ? (
        <CircularProgress
          size="6rem"
          value={submitProgress}
          color="purple.500"
          alignSelf="center"
          py={4}
        />
      ) : (
        <Stack direction="row" px="8" pt="4">
          <UserMediaBox>
            <Image src={maybeCidToUrl(registerState.photo)} />
          </UserMediaBox>
          <UserMediaBox>
            <MinimalVideoPlayer url={maybeCidToUrl(registerState.video)} />
          </UserMediaBox>
        </Stack>
      )}
    </RegisterScreen>
  )
}

export default SubmitPage
