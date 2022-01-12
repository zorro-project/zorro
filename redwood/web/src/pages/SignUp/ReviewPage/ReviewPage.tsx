import {Button} from '@chakra-ui/button'
import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags, useMutation} from '@redwoodjs/web'
import React, {useCallback, useContext} from 'react'
import ReactPlayer from 'react-player'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {dataUrlToBlob, isLocalUrl} from 'src/lib/util'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'

const ReviewPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  const [submitProgress, setSubmitProgress] = React.useState(-1)
  const signUpState = useAppSelector((state) => state.signUp)

  const dispatch = useAppDispatch()

  if (signUpState.photo == null || signUpState.video == null)
    return <Redirect to={routes.signUpRecord()} />

  const redo = useCallback(() => {
    dispatch(signUpSlice.actions.reset())
    navigate(routes.signUpRecord())
  }, [])

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
    <Stack spacing="6" flex="1" width="100%">
      <ReactPlayer
        url={maybeCidToUrl(signUpState.video)}
        controls
        width="100%"
        height="100%"
      />
      <MetaTags title="Review Profile" />
      <Spacer display={['initial', 'none']} />
      {submitProgress >= 0 ? (
        <Stack align="center" justify="center" direction="row">
          <CircularProgress value={submitProgress} />
          <Text>Submitting...</Text>
        </Stack>
      ) : (
        <>
          <Button colorScheme="purple" onClick={redo} alignSelf="center">
            Redo video
          </Button>
          <Button colorScheme="purple" onClick={submit} alignSelf="center">
            Submit application
          </Button>
        </>
      )}
    </Stack>
  )
}

export default ReviewPage
