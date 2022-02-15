import {ListItem, OrderedList, Text} from '@chakra-ui/layout'
import {Image, ScaleFade} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {useCallback, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {track} from 'src/lib/posthog'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {
  requireAuthenticated,
  requireNoExistingProfile,
} from '../../../lib/guards'
import RegisterScreen from '../RegisterScreen'
import UserMediaBox from '../UserMediaBox'
import {videoConstraints} from '../VideoPage/VideoPage'

const PhotoPage = () => {
  requireAuthenticated()
  requireNoExistingProfile()

  const {photo} = useAppSelector((state) => state.register)
  return !photo ? <TakePhotoStep /> : <ConfirmPhotoStep />
}

const TakePhotoStep = () => {
  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)
  const [isReady, setIsReady] = useState(false)

  const capturePhoto = useCallback(async () => {
    track('photo captured')
    const photoUrl = webcamRef.current?.getScreenshot()
    if (!photoUrl) return
    setIsReady(false)
    dispatch(registerSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcamRef])

  return (
    <RegisterScreen
      hero={
        <UserMediaBox shouldShowLoadingIndicator>
          <Webcam
            videoConstraints={videoConstraints}
            screenshotQuality={1}
            forceScreenshotSourceSize={true}
            mirrored
            ref={webcamRef}
            onUserMedia={() => setIsReady(true)}
          />
        </UserMediaBox>
      }
      title="Take a selfie"
      description={
        <OrderedList>
          <ListItem>Find good lighting</ListItem>
          <ListItem>Remove glasses or other face coverings</ListItem>
          <ListItem>Look directly at the camera</ListItem>
        </OrderedList>
      }
      primaryButtonLabel="Take photo"
      primaryButtonProps={{
        onClick: capturePhoto,
        disabled: !isReady,
      }}
    />
  )
}

const ConfirmPhotoStep = () => {
  const dispatch = useAppDispatch()
  const [areButtonsEnabled, setAreButtonsEnabled] = useState(false)
  const {photo} = useAppSelector((state) => state.register)
  const redoPhoto = useCallback(() => {
    track('redo photo clicked')
    setAreButtonsEnabled(false)
    dispatch(registerSlice.actions.setPhoto(undefined))
  }, [])

  return (
    <RegisterScreen
      hero={
        <ScaleFade
          in={true}
          key={photo?.substring(0, 2000)}
          transition={{enter: {duration: 1}}}
          initialScale={1}
          onAnimationComplete={() => setAreButtonsEnabled(true)}
          style={{flex: 1, display: 'flex'}}
        >
          <UserMediaBox>
            <Image src={maybeCidToUrl(photo!)} />
          </UserMediaBox>
        </ScaleFade>
      }
      title="Confirm photo"
      description={
        <Text>Can you see your entire face clearly? (No glasses, etc)</Text>
      }
      primaryButtonLabel="Use this photo"
      primaryButtonProps={{
        as: RLink,
        href: routes.registerVideo(),
        disabled: !areButtonsEnabled,
      }}
      secondaryButtonLabel="Retake photo"
      secondaryButtonProps={{onClick: redoPhoto, disabled: !areButtonsEnabled}}
    />
  )
}

export default PhotoPage
