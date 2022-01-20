import {Spacer, Text} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {Image, Stack, Button} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import React, {useContext} from 'react'
import ReactPlayer from 'react-player'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {appNav, dataUrlToBlob, isLocalUrl} from 'src/lib/util'
import {useAppSelector} from 'src/state/store'
import {
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'
import SignUpLogo from '../SignUpLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const SubmitPage = ({initialSubmitProgress = -1}) => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return appNav(routes.signUpIntro(), {replace: true})

  const [submitProgress, setSubmitProgress] = React.useState(
    initialSubmitProgress
  )
  const submitting = submitProgress >= 0
  const signUpState = useAppSelector((state) => state.signUp)

  if (signUpState.photo == null || signUpState.video == null)
    return appNav(routes.signUpPhoto(), {replace: true})

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
      <SignUpLogo />
      <Title title={submitting ? 'Uploading video' : 'Ready to submit'} />
      {submitting ? (
        <CircularProgress
          size="6rem"
          value={submitProgress}
          color="purple.500"
        />
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
        </>
      )}
      <Spacer />
      <Button variant="signup-primary" onClick={submit} disabled={submitting}>
        Submit application
      </Button>
    </Stack>
  )
}

export default SubmitPage
