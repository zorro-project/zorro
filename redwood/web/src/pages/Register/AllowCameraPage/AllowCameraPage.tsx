import {Text} from '@chakra-ui/layout'
import {useToast} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {
  MediaPermissionsError,
  MediaPermissionsErrorType,
  requestMediaPermissions,
} from 'mic-check'
import {useState} from 'react'
import {track} from 'src/lib/posthog'
import {requireAuthenticated} from '../../../lib/guards'
import RegisterScreen from '../RegisterScreen'

const AllowCameraPage: React.FC = () => {
  requireAuthenticated()

  const [requestingPermissions, setRequestingPermissions] = useState(false)

  const cameraError = useToast({status: 'error', position: 'top'})

  const requestPermissions = async () => {
    track('camera permission requested')

    setRequestingPermissions(true)
    requestMediaPermissions()
      .then(async () => {
        track('camera permission granted')

        navigate(routes.registerPhoto())
      })
      .catch((err: MediaPermissionsError) => {
        if (err.type === MediaPermissionsErrorType.SystemPermissionDenied) {
          track('camera denied by system')
          cameraError({
            title: "Your browser doesn't have permission to use your camera.",
          })
          // browser does not have permission to access camera or microphone
        } else if (
          err.type === MediaPermissionsErrorType.UserPermissionDenied
        ) {
          track('camera denied by user')

          cameraError({
            title: 'Please allow camera access to continue.',
          })
        } else if (
          err.type === MediaPermissionsErrorType.CouldNotStartVideoSource
        ) {
          track('camera denied because could not start video source')

          cameraError({
            title: "We couldn't activate your camera. Is another app using it?",
          })
        } else {
          console.error(err)
          track('camera denied unknown error')

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
