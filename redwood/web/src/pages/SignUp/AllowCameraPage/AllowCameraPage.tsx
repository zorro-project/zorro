import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch} from 'src/state/store'
import SignUpLogo from '../SignUpLogo'
import {videoConstraints} from '../VideoPage/VideoPage'

const AllowCameraPage: React.FC = () => {
  const cameraError = useToast({status: 'error', position: 'top'})
  const dispatch = useAppDispatch()

  const requestPermissions = async () => {
    requestMediaPermissions()
      .then(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        })

        const settings = stream.getVideoTracks()[0].getSettings()

        dispatch(
          signUpSlice.actions.setAspectRatio(
            (settings.width ?? 1) / (settings.height ?? 1)
          )
        )
        navigate(routes.signUpPhoto())
      })
      .catch((err: MediaPermissionsError) => {
        if (err.type === MediaPermissionsErrorType.SystemPermissionDenied) {
          cameraError({
            title: "Your browser doesn't have permission to use your camera.",
          })
          // browser does not have permission to access camera or microphone
        } else if (
          err.type === MediaPermissionsErrorType.UserPermissionDenied
        ) {
          cameraError({
            title: 'Please allow camera access to continue.',
          })
        } else if (
          err.type === MediaPermissionsErrorType.CouldNotStartVideoSource
        ) {
          cameraError({
            title: "We couldn't activate your camera. Is another app using it?",
          })
        } else {
          console.error(err)
          cameraError({
            title: "We couldn't activate your camera.",
          })
        }
      })
  }

  return (
    <Stack maxW="md" mx="auto" spacing="6" flex="1">
      <MetaTags title="Allow Camera" />
      <SignUpLogo />
      <Spacer />
      <Text>Everyone who registers records a short video</Text>
      <Text>
        These videos help ensure that each unique person only registers once.
      </Text>
      <Button variant="signup-primary" onClick={requestPermissions}>
        Allow Camera
      </Button>
    </Stack>
  )
}

export default AllowCameraPage
