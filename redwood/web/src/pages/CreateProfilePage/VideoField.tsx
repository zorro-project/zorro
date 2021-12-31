import {
  Box,
  Button,
  ButtonGroup,
  Link,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  ScaleFade,
  Stack,
  Text,
  useDisclosure,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import {useState} from 'react'
import {useController, useFormContext} from 'react-hook-form'
import ReactPlayer from 'react-player'
import Webcam from 'react-webcam'
import {VideoBox} from 'src/components/SquareBox'
import {dataUrlToBlob} from 'src/lib/util'
import {useFilePicker} from 'use-file-picker'
import {SignupFieldValues} from './types'

const VideoModal = (props: {
  modalCtrl: UseDisclosureReturn
  onSave: (newVideo: Blob) => void
}) => {
  const [webcamActive, setwebcamActive] = useState<boolean>(false)
  const [recording, setRecording] = useState(false)

  const [candidateVid, setCandidateVid] = useState<Blob | null>(null)

  const [openFileSelector, {filesContent}] = useFilePicker({
    readAs: 'DataURL',
    accept: 'video/*',
    multiple: true,
    limitFilesConfig: {max: 1},
  })

  React.useEffect(() => {
    if (filesContent.length < 1) return
    ;(async () =>
      setCandidateVid(await dataUrlToBlob(filesContent[0].content)))()
  }, [filesContent])

  const webcamRef = React.useRef<Webcam>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder>(null)

  const handleStartCaptureClick = React.useCallback(() => {
    setRecording(true)
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: 'video/webm',
    })
    mediaRecorderRef.current.addEventListener('dataavailable', ({data}) => {
      // Create a copy of the blob with the mime type set to 'video/webm'.
      // Without this at least on MacOS/Chrome I get a mime type of
      // video/x-matroska;codecs=avc1,opus, which Infura refuses to accept
      // as a valid mime-type when uploading the video.
      const video = data.slice(0, data.size, 'video/webm')
      setCandidateVid(video)
    })
    mediaRecorderRef.current.start()
  }, [webcamRef, setRecording, mediaRecorderRef])

  const handleStopCaptureClick = React.useCallback(() => {
    mediaRecorderRef.current.stop()
    setRecording(false)
    setwebcamActive(false)
  }, [mediaRecorderRef, webcamRef, setRecording])

  const saveVideo = () => {
    props.onSave(candidateVid)
    setCandidateVid(null)
    props.modalCtrl.onClose()
  }

  return (
    <Modal
      isOpen={props.modalCtrl.isOpen}
      onClose={props.modalCtrl.onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Record a Video</ModalHeader>
        <ModalBody>
          <Stack spacing="8" align="center">
            <Box>
              <Text mb="2">
                Recording a video makes it harder for bots to get into the
                registry. In your video, you should:
              </Text>
              <OrderedList fontSize="sm">
                <ListItem>Make sure your face is fully visible.</ListItem>
                <ListItem>
                  Raise your right hand, and repeat the following:
                  <br />
                  <strong>
                    "I solemnly swear this is my first time registering a Zorro
                    account"
                  </strong>
                </ListItem>
              </OrderedList>
            </Box>
            {webcamActive && (
              <>
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  bgColor="gray.600"
                  width="100%"
                >
                  <Webcam
                    videoConstraints={{facingMode: 'user'}}
                    audio
                    muted
                    ref={webcamRef}
                  />
                </Box>
                <ButtonGroup justify="center" pb="4">
                  {recording ? (
                    <Button
                      colorScheme="green"
                      onClick={handleStopCaptureClick}
                    >
                      Finish Recording
                    </Button>
                  ) : (
                    <>
                      <Button
                        colorScheme="red"
                        onClick={handleStartCaptureClick}
                      >
                        Start Recording
                      </Button>
                      <Button onClick={() => setwebcamActive(false)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </ButtonGroup>
              </>
            )}
            {candidateVid && !webcamActive && (
              <ScaleFade in={candidateVid && !webcamActive}>
                <Stack spacing="8" align="center">
                  <Box borderRadius="md" overflow="hidden" shadow="md">
                    <ReactPlayer
                      url={URL.createObjectURL(candidateVid)}
                      controls
                      width="100%"
                      height="auto"
                    />
                  </Box>
                  <ButtonGroup justify="center" pb="4">
                    <Button colorScheme="blue" onClick={saveVideo}>
                      Use This
                    </Button>
                    <Button onClick={() => setCandidateVid(null)}>
                      Choose Another
                    </Button>
                  </ButtonGroup>
                </Stack>
              </ScaleFade>
            )}
            {!candidateVid && !webcamActive && (
              <ButtonGroup justify="center" colorScheme="teal" pb="4">
                <Button onClick={openFileSelector}>Upload Video</Button>
                <Button onClick={() => setwebcamActive(true)}>
                  Use Webcam
                </Button>
              </ButtonGroup>
            )}
          </Stack>
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  )
}

const VideoField = () => {
  const modalControl = useDisclosure()

  const {control} = useFormContext<SignupFieldValues>()
  const {field} = useController({
    name: 'videoCid',
    control,
    rules: {required: true},
  })

  return (
    <>
      <VideoModal modalCtrl={modalControl} onSave={field.onChange} />
      {field.value ? (
        <Stack>
          <VideoBox video={field.value as Blob} width="36" shadow="lg" />
          <Link
            as="button"
            type="button"
            variant="btn"
            onClick={modalControl.onOpen}
          >
            Change
          </Link>
        </Stack>
      ) : (
        <Button onClick={modalControl.onOpen}>Record Video</Button>
      )}
    </>
  )
}

export default VideoField
