import {Box, Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {requestMediaPermissions} from 'mic-check'
import {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Webcam from 'react-webcam'
import UserContext from 'src/layouts/UserContext'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'

const TakePicture: React.FC<{webcam: RefObject<Webcam>}> = ({webcam}) => {
  const dispatch = useAppDispatch()

  const capturePicture = useCallback(async () => {
    const photoUrl = webcam.current?.getScreenshot()
    if (!photoUrl) return
    dispatch(signUpSlice.actions.setPhoto(photoUrl))
  }, [dispatch, webcam])

  return (
    <>
      <Text>Everyone who registers records a short video.</Text>
      <Text>
        These videos help ensure that each unique person only registers once.
      </Text>
      <Button onClick={capturePicture} colorScheme="purple" alignSelf="center">
        My face is visible
      </Button>
    </>
  )
}

const RecordVideo: React.FC<{webcam: RefObject<Webcam>}> = ({webcam}) => {
  const dispatch = useAppDispatch()
  const [recording, setRecording] = useState(false)
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
  }, [webcam, setRecording, mediaRecorderRef])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [mediaRecorderRef, setRecording])

  if (!recording) {
    return (
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
    )
  }
  return (
    <>
      <Text>
        Say this:
        <br />
        <strong>
          "I swear that this is my first time registering on Zorro"
        </strong>
      </Text>
      <Button onClick={stopRecording} colorScheme="purple" alignSelf="center">
        Stop recording
      </Button>
    </>
  )
}

const RecordPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => navigate(routes.signUpAllowCamera()))
  }, [])

  const {photo, video} = useAppSelector((state) => state.signUp)
  const webcamRef = useRef<Webcam>(null)

  if (video) return <Redirect to={routes.signUpReview()} />

  return (
    <Stack spacing="6" flex="1">
      <Box background="black" width="100%">
        <Webcam
          videoConstraints={{facingMode: 'user'}}
          audio
          muted
          mirrored
          ref={webcamRef}
        />
      </Box>
      <Spacer display={['initial', 'none']} />
      <MetaTags title="Record Video" />
      {!photo && <TakePicture webcam={webcamRef} />}
      {photo && <RecordVideo webcam={webcamRef} />}
    </Stack>
  )
}

export default RecordPage
