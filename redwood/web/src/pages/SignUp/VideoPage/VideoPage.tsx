import {Box, Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {requestMediaPermissions} from 'mic-check'
import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import ReactPlayer from 'react-player'
import Webcam from 'react-webcam'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'

const VideoPage = ({mockRecording = false}) => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress)
    return appNav(routes.signUpIntro(), {
      toast: {
        title: 'Please connect a wallet',
        status: 'warning',
      },
    })

  const {photo, video} = useAppSelector((state) => state.signUp)
  if (!photo) return appNav(routes.signUpPhoto({replace: true}))

  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => navigate(routes.signUpAllowCamera()))
  }, [])

  const webcamRef = useRef<Webcam>(null)

  const dispatch = useAppDispatch()
  const [recording, setRecording] = useState(mockRecording)
  const mediaRecorderRef = React.useRef<MediaRecorder>(null)

  const startRecording = useCallback(async () => {
    setRecording(true)
    // @ts-expect-error TODO: why are we assigning to a supposedly readonly ref
    // here? Just copied the example from
    // https://codepen.io/mozmorris/pen/yLYKzyp?editors=0010
    mediaRecorderRef.current = new MediaRecorder(webcam.current.stream, {
      mimeType: 'video/webm',
    })
    mediaRecorderRef.current.addEventListener('dataavailable', ({data}) => {
      // Create a copy of the blob with the mime type set to 'video/webm'.
      // Without this at least on MacOS/Chrome I get a mime type of
      // video/x-matroska;codecs=avc1,opus, which Infura refuses to accept
      // as a valid mime-type when uploading the video.
      const video = data.slice(0, data.size, 'video/webm')
      dispatch(signUpSlice.actions.setVideo(URL.createObjectURL(video)))
    })
    mediaRecorderRef.current.start()
  }, [webcamRef.current, setRecording, mediaRecorderRef.current])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [mediaRecorderRef, setRecording])

  return (
    <Stack spacing="6" flex="1">
      <Box background="black" width="100%">
        {video ? (
          <ReactPlayer
            url={maybeCidToUrl(video)}
            controls
            width="100%"
            height="100%"
          />
        ) : (
          <Webcam
            videoConstraints={{facingMode: 'user', width: 1280, height: 720}}
            audio
            muted
            mirrored
            ref={webcamRef}
          />
        )}
      </Box>
      <Spacer />
      <MetaTags title="Record Video" />
      {!recording && !video && (
        <>
          <Text>
            Ready to be sworn in? Just read the words on the next screen.
          </Text>
          <Button
            onClick={startRecording}
            colorScheme="purple"
            alignSelf="center"
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
          <Button
            onClick={stopRecording}
            colorScheme="purple"
            alignSelf="center"
          >
            Stop recording
          </Button>
        </>
      )}
      {video && !recording && (
        <>
          <Button
            colorScheme="purple"
            onClick={() => dispatch(signUpSlice.actions.setVideo(undefined))}
            alignSelf="center"
          >
            Redo video
          </Button>
          <Button
            as={RLink}
            href={routes.signUpEmail()}
            colorScheme="purple"
            alignSelf="center"
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
