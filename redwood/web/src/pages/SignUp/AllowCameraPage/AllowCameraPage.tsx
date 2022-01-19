import {Spacer, Text, VStack} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import SignUpLogo from '../SignUpLogo'

const AllowCameraPage: React.FC = () => {
  const cameraError = useToast({status: 'error', position: 'top'})

  const requestPermissions = async () => {
    requestMediaPermissions()
      .then(() => navigate(routes.signUpPhoto()))
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
          cameraError({
            title: "We couldn't activate your camera.",
          })
        }
      })
  }

  return (
    <VStack maxW="md" mx="auto" spacing="6" flex="1">
      <SignUpLogo />
      <MetaTags title="Allow Camera" />
      <Spacer display={['initial', 'none']} />
      <Text>Everyone who registers records a short video</Text>
      <Text>
        These videos help ensure that each unique person only registers once.
      </Text>
      <Button onClick={requestPermissions} colorScheme="purple">
        Allow Camera
      </Button>
    </VStack>
  )
}

export default AllowCameraPage
