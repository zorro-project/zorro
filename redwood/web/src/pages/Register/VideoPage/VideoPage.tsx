import {AspectRatio, Box, Stack, Text} from '@chakra-ui/layout'
import {Button, Fade, Spacer} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useCallback, useRef, useState} from 'react'
import ReactPlayer from 'react-player'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {useGuard} from 'src/lib/useGuard'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'
import {useIsFirstRender} from 'usehooks-ts'
import {requireCameraAllowed, requireWalletConnected} from '../guards'
import UserMediaBox from '../UserMediaBox'

export const videoConstraints: MediaTrackConstraints = {
  facingMode: 'user',
  width: 1280,
  height: 720,
}

const VideoPage = ({mockRecording = false}) => {
  requireWalletConnected()
  requireCameraAllowed()

  const {photo, video} = useAppSelector((state) => state.register)
  useGuard(photo, routes.registerPhoto())

  const webcamRef = useRef<Webcam>(null)
  const [webcamReady, setWebcamReady] = useState(false)

  const dispatch = useAppDispatch()
  const [recording, setRecording] = useState(mockRecording)
  const [aspectRatio, setAspectRatio] = useState(1)
  const mediaRecorderRef = React.useRef<MediaRecorder>(null)

  const onUserMedia = useCallback((stream: MediaStream) => {
    const settings = stream.getVideoTracks()[0].getSettings()
    setAspectRatio((settings.width ?? 1) / (settings.height ?? 1))
    setWebcamReady(true)
  }, [])

  const startRecording = useCallback(async () => {
    setRecording(true)
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
  }, [webcamRef.current, setRecording, mediaRecorderRef.current])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [mediaRecorderRef, setRecording])

  const firstRender = useIsFirstRender()

  return (
    <Stack spacing="6" flex="1">
      <MetaTags title="Record Video" />
      <UserMediaBox position="relative">
        <Fade
          in={true}
          key={video}
          transition={{enter: {duration: firstRender ? 0 : 0.25}}}
          style={{flex: 1, display: 'flex'}}
        >
          {video ? (
            <ReactPlayer
              url={maybeCidToUrl(video)}
              controls
              width="100%"
              height="100%"
            />
          ) : (
            <>
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
                in={recording}
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
                <AspectRatio
                  ratio={aspectRatio}
                  width="100%"
                  position="relative"
                >
                  <Box>
                    <Box
                      backgroundColor="red.500"
                      shadow="md"
                      top={3}
                      right={3}
                      position="absolute"
                      h={6}
                      w={6}
                      borderRadius="50%"
                    />
                  </Box>
                </AspectRatio>
              </Fade>
              {/* End recording indicator */}
            </>
          )}
        </Fade>
      </UserMediaBox>
      {!recording && !video && (
        <>
          <Text>
            Ready to be sworn in? Just read the words on the next screen.
          </Text>
          <Spacer />
          <Button
            variant="register-primary"
            onClick={startRecording}
            disabled={!webcamReady}
          >
            I'm ready, start recording
          </Button>
        </>
      )}
      {recording && (
        <>
          <Text>
            Say this:
            <br />
            <strong>
              "I swear that this is my first time registering on Zorro"
            </strong>
          </Text>
          <Button variant="register-primary" onClick={stopRecording}>
            Stop recording
          </Button>
        </>
      )}
      {video && !recording && (
        <>
          <Spacer />
          <Button
            variant="register-primary"
            onClick={() => dispatch(registerSlice.actions.setVideo(undefined))}
          >
            Redo video
          </Button>
          <Button
            variant="register-primary"
            as={RLink}
            href={routes.registerEmail()}
            px="12"
          >
            Continue
          </Button>
        </>
      )}
    </Stack>
  )
}

export default VideoPage
