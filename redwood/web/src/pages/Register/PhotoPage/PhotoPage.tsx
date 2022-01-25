import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, Fade, Image} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useCallback, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {useIsFirstRender} from 'usehooks-ts'
import {requireCameraAllowed, requireWalletConnected} from '../guards'
import UserMediaBox from '../UserMediaBox'
import {videoConstraints} from '../VideoPage/VideoPage'

const PhotoPage = () => {
  requireWalletConnected()
  requireCameraAllowed()

  const {photo} = useAppSelector((state) => state.register)

  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)
  const [webcamReady, setWebcamReady] = useState(false)

  const capturePicture = useCallback(async () => {
    const photoUrl = webcamRef.current?.getScreenshot()
    if (!photoUrl) return
    dispatch(registerSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcamRef])

  const firstRender = useIsFirstRender()

  return (
    <Stack spacing="6" flex="1">
      <MetaTags title="Take photo" />
      <UserMediaBox>
        <Fade
          in={true}
          key={photo}
          transition={{enter: {duration: firstRender ? 0 : 0.25}}}
          style={{flex: 1, display: 'flex'}}
        >
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
        </Fade>
      </UserMediaBox>
      {photo ? (
        <>
          <Spacer />

          <Button
            variant="register-primary"
            onClick={() => dispatch(registerSlice.actions.setPhoto(undefined))}
          >
            Redo photo
          </Button>
          <Button
            variant="register-primary"
            as={RLink}
            href={routes.registerVideo()}
            px="12"
          >
            Use this photo
          </Button>
        </>
      ) : (
        <>
          <Text>
            Make sure you're <strong>looking directly at the camera</strong> in{' '}
            <strong>good lighting</strong> and that your{' '}
            <strong>face is fully visible</strong>.
          </Text>
          <Spacer />
          <Button
            variant="register-primary"
            onClick={capturePicture}
            disabled={!webcamReady}
          >
            Take photo
          </Button>
        </>
      )}
    </Stack>
  )
}

export default PhotoPage
