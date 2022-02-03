import {Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {Image, Stack, useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import React, {useCallback} from 'react'
import {useUser} from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {useGuard} from 'src/lib/useGuard'
import {dataUrlToBlob, isLocalUrl, maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {AttemptRegistration, AttemptRegistrationVariables} from 'types/graphql'
import {useSigner} from 'wagmi'
import {requireWalletConnected} from '../../../lib/guards'
import MinimalVideoPlayer from '../MinimalVideoPlayer'
import RegisterScreen from '../RegisterScreen'
import UserMediaBox from '../UserMediaBox'

const SubmitPage = ({initialSubmitProgress = -1}) => {
  const {registrationAttempt, refetch: refetchUser} = useUser()
  const ethereumAddress = requireWalletConnected()

  const [submitProgress, setSubmitProgress] = React.useState(
    initialSubmitProgress
  )
  const submitting = submitProgress >= 0
  const registerState = useAppSelector((state) => state.register)
  const dispatch = useAppDispatch()

  const [{data: signer}] = useSigner()

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
    dispatch(registerSlice.actions.resetForm())
    navigate(routes.registerPhoto())
  }, [])

  const toast = useToast()
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

    if (!signer) {
      setSubmitProgress(-1)

      return toast({
        status: 'error',
        title: 'Error, cannot connect to Metamask to generate signature.',
      })
    }
    // This is a dummy signature we don't use for anything right now. Purpose is
    // simply user testing with a signature in the flow to see whether it
    // confuses folks.
    const _signature = await signer.signMessage(
      `
Sign this message to authenticate your Zorro account.

Ethereum address: ${ethereumAddress}
Profile data hash: 79c4078d81cf1d910
`
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
          ethereumAddress,
          photoCid,
          videoCid,
        },
      },
    })

    await refetchUser?.()
    navigate(routes.registerSubmitted())
  }, [ethereumAddress, attemptRegistrationMutation, signer])

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
            <MinimalVideoPlayer
              url={maybeCidToUrl(registerState.video)}
              width="100%"
              height="100%"
            />
          </UserMediaBox>
        </Stack>
      )}
    </RegisterScreen>
  )
}

export default SubmitPage
