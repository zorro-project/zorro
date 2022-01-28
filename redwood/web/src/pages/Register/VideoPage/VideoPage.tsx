import {AspectRatio, Box, Stack, Text} from '@chakra-ui/layout'
import {Button, Fade, Spacer, Icon, Center} from '@chakra-ui/react'
import {routes, navigate} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useCallback, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {useGuard} from 'src/lib/useGuard'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {requireCameraAllowed, requireWalletConnected} from '../guards'
import UserMediaBox from '../UserMediaBox'
import MinimalVideoPlayer from '../MinimalVideoPlayer'
import RegisterScreen from '../RegisterScreen'

export const videoConstraints: MediaTrackConstraints = {
  facingMode: 'user',
  width: 1280,
  height: 720,
}

const VideoPage = () => {
  requireWalletConnected()
  requireCameraAllowed()

  const {photo, video} = useAppSelector((state) => state.register)
  useGuard(photo, routes.registerPhoto())

  return !video ? <RecordStep /> : <ConfirmStep />
}

const RecordStep = ({mockRecording = false}) => {
  const dispatch = useAppDispatch()
  const webcamRef = useRef<Webcam>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder>(null)
  const [isStreamReady, setIsStreamReady] = useState(false)
  const [isRecording, setIsRecording] = useState(mockRecording)

  const [aspectRatio, setAspectRatio] = useState(1)

  const onUserMedia = useCallback((stream: MediaStream) => {
    const settings = stream.getVideoTracks()[0].getSettings()
    setAspectRatio((settings.width ?? 1) / (settings.height ?? 1))
    setIsStreamReady(true)
  }, [])

  const startRecording = useCallback(async () => {
    setIsRecording(true)
    // @ts-expect-error TODO: why are we assigning to a supposedly readonly ref
    // here? Just copied the example from
    // https://codepen.io/mozmorris/pen/yLYKzyp?editors=0010
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: 'video/webm',
    })
    mediaRecorderRef.current.addEventListener('dataavailable', ({data}) => {
      // Create a copy of the blob with the mime type set to 'video/webm'.
      // Without this at least on MacOS/Chrome I get a mime type of
      // video/x-matroska;codecs=avc1,opus, which Infura refuses to accept
      // as a valid mime-type when uploading the video.
      const video = data.slice(0, data.size, 'video/webm')
      dispatch(registerSlice.actions.setVideo(URL.createObjectURL(video)))
    })
    mediaRecorderRef.current.start()
  }, [webcamRef.current, setIsRecording, mediaRecorderRef.current])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    setIsStreamReady(false)
  }, [mediaRecorderRef, setIsRecording, setIsStreamReady])

  return (
    <RegisterScreen
      hero={
        <UserMediaBox shouldShowLoadingIndicator>
          <Webcam
            videoConstraints={videoConstraints}
            audio
            muted
            mirrored
            ref={webcamRef}
            style={{position: 'relative'}}
            onUserMedia={onUserMedia}
          />
          {/* Recording indicator */}
          <Fade
            in={isRecording}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <AspectRatio ratio={aspectRatio} width="100%" position="relative">
              <Box>
                <Box
                  backgroundColor="red.500"
                  shadow="md"
                  top={5}
                  right={5}
                  position="absolute"
                  h={6}
                  w={6}
                  borderRadius="50%"
                />
              </Box>
            </AspectRatio>
          </Fade>
          {/* End recording indicator */}
        </UserMediaBox>
      }
      title={!isRecording ? 'Record video' : 'Say this:'}
      description={
        !isRecording ? (
          <Text>
            Ready to be sworn in? Just read the words on the next screen.
          </Text>
        ) : (
          <Text>"I swear this is my first time registering on Zorro"</Text>
        )
      }
      primaryButtonLabel={
        !isRecording ? "I'm ready, start recording" : 'Stop recording'
      }
      primaryButtonProps={{
        onClick: isRecording ? stopRecording : startRecording,
        disabled: !isStreamReady,
      }}
    />
  )
}

const ConfirmStep = () => {
  const dispatch = useAppDispatch()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const {video} = useAppSelector((state) => state.register)

  const redoVideo = useCallback(() => {
    dispatch(registerSlice.actions.setVideo(undefined))
  }, [])

  const maybeContinue = useCallback(() => {
    if (hasPlayed) navigate(routes.registerEmail())
    else alert('maybe play first...?')
  }, [hasPlayed])

  return (
    <RegisterScreen
      hero={
        <UserMediaBox position="relative">
          <MinimalVideoPlayer
            url={maybeCidToUrl(video)}
            width="100%"
            height="100%"
            onReady={() => setTimeout(() => setIsLoaded(true), 500)}
            onPlay={() => setHasPlayed(true)}
          />
        </UserMediaBox>
      }
      title="Confirm video"
      description={<Text>Did the video come out OK?</Text>}
      primaryButtonLabel="Use this video"
      primaryButtonProps={{
        onClick: maybeContinue,
        disabled: !isLoaded,
      }}
      secondaryButtonLabel="Redo video"
      secondaryButtonProps={{onClick: redoVideo, disabled: !isLoaded}}
    />
  )
}

export default VideoPage
