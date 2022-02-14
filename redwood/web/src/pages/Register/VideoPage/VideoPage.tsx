import {AspectRatio, Box, Text} from '@chakra-ui/layout'
import {Fade} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {useCallback, useRef, useState} from 'react'
import Webcam from 'react-webcam'
import MinimalVideoPlayer from 'src/components/MinimalVideoPlayer'
import {requireAuthenticated, requireNoExistingProfile} from 'src/lib/guards'
import {track} from 'src/lib/posthog'
import {useGuard} from 'src/lib/useGuard'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import RegisterScreen from '../RegisterScreen'
import UserMediaBox from '../UserMediaBox'

export const videoConstraints: MediaTrackConstraints = {
  facingMode: 'user',
  width: 1280,
  height: 720,
}

const VideoPage = ({mockRecording = false}: {mockRecording?: boolean}) => {
  requireAuthenticated()
  requireNoExistingProfile()

  const {photo, video} = useAppSelector((state) => state.register)
  useGuard(photo, routes.registerPhoto())

  return !video ? (
    <RecordVideoStep mockRecording={mockRecording} />
  ) : (
    <ConfirmVideoStep />
  )
}

const RecordVideoStep = ({mockRecording}: {mockRecording?: boolean}) => {
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
    track('recording started')

    // Get the first supported mimetype from the list.
    const mimeType = ['video/webm;codecs=vp8,opus', 'video/mp4'].filter(
      MediaRecorder.isTypeSupported
    )[0]

    setIsRecording(true)
    // @ts-expect-error TODO: why are we assigning to a supposedly readonly ref
    // here? Just copied the example from
    // https://codepen.io/mozmorris/pen/yLYKzyp?editors=0010
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType,
    })
    mediaRecorderRef.current.addEventListener('dataavailable', ({data}) => {
      dispatch(registerSlice.actions.setVideo(URL.createObjectURL(data)))
    })
    mediaRecorderRef.current.start()
  }, [webcamRef.current, setIsRecording, mediaRecorderRef.current])

  const stopRecording = useCallback(() => {
    track('recording stopped')
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    setIsStreamReady(false)
  }, [mediaRecorderRef, setIsRecording, setIsStreamReady])

  const registrationStatement =
    process.env.CHAIN_DEPLOYMENT === 'production'
      ? 'I swear this is my first time registering on Zorro'
      : "I swear that I'm registering on Zorro for testing purposes"

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
          <Text fontSize="xl">{`"${registrationStatement}"`}</Text>
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

const ConfirmVideoStep = () => {
  const dispatch = useAppDispatch()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const {video} = useAppSelector((state) => state.register)

  const redoVideo = useCallback(() => {
    track('redo video clicked')
    dispatch(registerSlice.actions.setVideo(undefined))
  }, [])

  return (
    <RegisterScreen
      hero={
        <UserMediaBox>
          <MinimalVideoPlayer
            url={maybeCidToUrl(video!)}
            onReady={() => setTimeout(() => setIsLoaded(true), 500)}
            onEnded={() => setHasPlayed(true)}
            playOnLoad
          />
        </UserMediaBox>
      }
      title="Confirm video"
      description={<Text>Can see and hear yourself clearly?</Text>}
      primaryButtonLabel="Use this video"
      primaryButtonProps={{
        onClick: () => navigate(routes.registerEmail()),
        disabled: !isLoaded || !hasPlayed,
      }}
      secondaryButtonLabel="Redo video"
      secondaryButtonProps={{onClick: redoVideo, disabled: !isLoaded}}
    />
  )
}

export default VideoPage
