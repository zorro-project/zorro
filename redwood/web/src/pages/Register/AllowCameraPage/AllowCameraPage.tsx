import {Text} from '@chakra-ui/layout'
import {useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import {useState} from 'react'
import {requireWalletConnected} from '../../../lib/guards'
import RegisterScreen from '../RegisterScreen'

const AllowCameraPage: React.FC = () => {
  requireWalletConnected()

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
    <RegisterScreen
      shouldHideTitle
      title="Allow camera"
      buttonDescription={
        <>
          <Text>
            Everyone who registers takes a selfie, so we need access to your
            camera. This helps make sure everyone only registers once.
          </Text>
        </>
      }
      primaryButtonLabel="Allow camera"
      primaryButtonProps={{
        onClick: requestPermissions,
        isLoading: requestingPermissions,
      }}
    />
  )
}

export default AllowCameraPage
