import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import {useContext, useEffect, useState} from 'react'
import UserContext from 'src/layouts/UserContext'
import {appNav, useNav} from 'src/lib/util'
import RegisterLogo from '../RegisterLogo'

export const requireCameraAllowed = async () => {
  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => appNav(routes.registerAllowCamera()))
  }, [])
}

const AllowCameraPage: React.FC = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return useNav(routes.registerIntro(), {replace: true})

  const [requestingPermissions, setRequestingPermissions] = useState(false)

  const cameraError = useToast({status: 'error', position: 'top'})

  const requestPermissions = async () => {
    setRequestingPermissions(true)
    requestMediaPermissions()
      .then(async () => {
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
        setRequestingPermissions(false)
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
      <Button
        variant="register-primary"
        onClick={requestPermissions}
        disabled={requestingPermissions}
      >
        Allow Camera
      </Button>
    </Stack>
  )
}

export default AllowCameraPage
