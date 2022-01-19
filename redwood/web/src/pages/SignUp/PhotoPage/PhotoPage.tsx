import {Box, Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, Image} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {requestMediaPermissions} from 'mic-check'
import {useCallback, useContext, useEffect, useRef} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'

const PhotoPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return appNav(routes.signUpIntro(), {replace: true})

  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => navigate(routes.signUpAllowCamera()))
  }, [])

  const {photo} = useAppSelector((state) => state.signUp)

  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)

  const capturePicture = useCallback(async () => {
    const photoUrl = webcamRef.current?.getScreenshot()
    if (!photoUrl) return
    dispatch(signUpSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcamRef])

  return (
    <Stack spacing="6" flex="1">
      <Box background="black" width="100%">
        {photo ? (
          <Image src={maybeCidToUrl(photo)} />
        ) : (
          <Webcam
            videoConstraints={{facingMode: 'user', width: 1280, height: 720}}
            screenshotQuality={1}
            forceScreenshotSourceSize={true}
            mirrored
            ref={webcamRef}
          />
        )}
      </Box>
      <Spacer />
      <MetaTags title="Take photo" />
      {photo ? (
        <>
          <Button
            onClick={() => dispatch(signUpSlice.actions.setPhoto(undefined))}
            colorScheme="purple"
            alignSelf="center"
          >
            Redo photo
          </Button>
          <Button
            as={RLink}
            href={routes.signUpVideo()}
            colorScheme="purple"
            px="12"
            alignSelf="center"
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
            onClick={capturePicture}
            colorScheme="purple"
            alignSelf="center"
          >
            Take photo
          </Button>
        </>
      )}
    </Stack>
  )
}

export default PhotoPage
