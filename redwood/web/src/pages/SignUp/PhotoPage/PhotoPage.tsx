import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Fade, Image, Button} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {requestMediaPermissions} from 'mic-check'
import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {useNav} from 'src/lib/util'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {useIsFirstRender} from 'usehooks-ts'
import UserMediaBox from '../UserMediaBox'
import {videoConstraints} from '../VideoPage/VideoPage'

const PhotoPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return useNav(routes.signUpIntro(), {replace: true})

  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => navigate(routes.signUpAllowCamera()))
  }, [])

  const {photo} = useAppSelector((state) => state.signUp)

  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)
  const [webcamReady, setWebcamReady] = useState(false)

  const capturePicture = useCallback(async () => {
    const photoUrl = webcamRef.current?.getScreenshot()
    if (!photoUrl) return
    dispatch(signUpSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcamRef])

  const firstRender = useIsFirstRender()

  return (
    <Fade
      in={true}
      key={photo}
      transition={{enter: {duration: firstRender ? 0 : 0.25}}}
      style={{flex: 1, display: 'flex'}}
    >
      <Stack spacing="6" flex="1">
        <UserMediaBox>
          {photo ? (
            <Image src={maybeCidToUrl(photo)} />
          ) : (
            <Webcam
              videoConstraints={videoConstraints}
              screenshotQuality={1}
              forceScreenshotSourceSize={true}
              mirrored
              ref={webcamRef}
              onUserMedia={() => setWebcamReady(true)}
            />
          )}
        </UserMediaBox>
        <Spacer />
        <MetaTags title="Take photo" />
        {photo ? (
          <>
            <Button
              variant="signup-primary"
              onClick={() => dispatch(signUpSlice.actions.setPhoto(undefined))}
            >
              Redo photo
            </Button>
            <Button
              variant="signup-primary"
              as={RLink}
              href={routes.signUpVideo()}
              px="12"
            >
              Use this photo
            </Button>
          </>
        ) : (
          <>
            <Text>
              Make sure youre <strong>looking directly at the camera</strong> in{' '}
              <strong>good lighting</strong> and that your{' '}
              <strong>face is fully visible</strong>.
            </Text>
            <Button
              variant="signup-primary"
              onClick={capturePicture}
              disabled={!webcamReady}
            >
              Take photo
            </Button>
          </>
        )}
      </Stack>
    </Fade>
  )
}

export default PhotoPage
