import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, Image, ScaleFade} from '@chakra-ui/react'
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
  const [buttonsEnabled, setButtonsEnabled] = useState(!!photo)

  const redoPhoto = useCallback(() => {
    setButtonsEnabled(false)
    dispatch(registerSlice.actions.setPhoto(undefined))
  }, [])

  const capturePicture = useCallback(async () => {
    const photoUrl = webcamRef.current?.getScreenshot()
    if (!photoUrl) return
    setButtonsEnabled(false)
    dispatch(registerSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcamRef])

  const firstRender = useIsFirstRender()

  return (
    <Stack spacing="6" flex="1">
      <MetaTags title="Take photo" />
      <UserMediaBox>
        <ScaleFade
          in={true}
          key={photo?.substring(0, 2000)}
          transition={{enter: {duration: firstRender ? 0 : 1}}}
          initialScale={1}
          onAnimationComplete={() => !firstRender && setButtonsEnabled(true)}
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
              onUserMedia={() => setButtonsEnabled(true)}
            />
          )}
        </ScaleFade>
      </UserMediaBox>
      {photo ? (
        <>
          <Spacer />

          <Button
            variant="register-primary"
            onClick={redoPhoto}
            disabled={!buttonsEnabled}
          >
            Redo photo
          </Button>
          <Button
            variant="register-primary"
            as={RLink}
            href={routes.registerVideo()}
            px="12"
            disabled={!buttonsEnabled}
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
            disabled={!buttonsEnabled}
          >
            Take photo
          </Button>
        </>
      )}
    </Stack>
  )
}

export default PhotoPage
