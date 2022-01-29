import {Text, OrderedList, ListItem} from '@chakra-ui/layout'
import {Image, ScaleFade, Box} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {useCallback, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {requireCameraAllowed, requireWalletConnected} from '../../../lib/guards'
import UserMediaBox from '../UserMediaBox'
import {videoConstraints} from '../VideoPage/VideoPage'
import RegisterScreen from '../RegisterScreen'

const PhotoPage = () => {
  requireWalletConnected()
  requireCameraAllowed()

  const {photo} = useAppSelector((state) => state.register)
  return !photo ? <TakePhotoStep /> : <ConfirmPhotoStep />
}

const TakePhotoStep = () => {
  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)
  const [isReady, setIsReady] = useState(false)

  const capturePhoto = useCallback(async () => {
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
    setAreButtonsEnabled(false)
    dispatch(registerSlice.actions.setPhoto(undefined))
  }, [])

  return (
    <RegisterScreen
      hero={
        <UserMediaBox>
          <ScaleFade
            in={true}
            key={photo?.substring(0, 2000)}
            transition={{enter: {duration: 1}}}
            initialScale={1}
            onAnimationComplete={() => setAreButtonsEnabled(true)}
            style={{flex: 1, display: 'flex'}}
          >
            <Image src={maybeCidToUrl(photo!)} />
          </ScaleFade>
        </UserMediaBox>
      }
      title="Confirm photo"
      description={<Text>Can you see your face clearly?</Text>}
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
