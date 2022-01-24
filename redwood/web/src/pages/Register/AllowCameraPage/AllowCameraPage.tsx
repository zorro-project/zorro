import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import {useContext} from 'react'
import UserContext from 'src/layouts/UserContext'
import {useNav} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch} from 'src/state/store'
import RegisterLogo from '../RegisterLogo'
import {videoConstraints} from '../VideoPage/VideoPage'

const AllowCameraPage: React.FC = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return useNav(routes.registerIntro(), {replace: true})

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
          registerSlice.actions.setAspectRatio(
            (settings.width ?? 1) / (settings.height ?? 1)
          )
        )
        navigate(routes.registerPhoto())
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
      <RegisterLogo />
      <Spacer />
      <Text>Everyone who registers records a short video</Text>
      <Text>
        These videos help ensure that each unique person only registers once.
      </Text>
      <Button variant="register-primary" onClick={requestPermissions}>
        Allow Camera
      </Button>
    </Stack>
  )
}

export default AllowCameraPage
