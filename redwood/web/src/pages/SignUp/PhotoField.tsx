import {
  Box,
  Button,
  ButtonGroup,
  Image,
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
import Webcam from 'react-webcam'
import {PhotoBox} from 'src/components/SquareBox'
import {dataUrlToBlob} from 'src/lib/util'
import {useFilePicker} from 'use-file-picker'
import {SignupFieldValues} from './SignUpContext'

const PhotoModal = (props: {
  modalCtrl: UseDisclosureReturn
  onSave: (newPhoto: Blob) => void
}) => {
  const [webcamActive, setWebcamActive] = useState<boolean>(false)
  const [candidatePic, setCandidatePic] = useState<Blob | null>(null)

  const [openFileSelector, {filesContent}] = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: true,
    limitFilesConfig: {max: 1},
  })

  React.useEffect(() => {
    if (filesContent.length < 1) return
    ;(async () =>
      setCandidatePic(await dataUrlToBlob(filesContent[0].content)))()
  }, [filesContent])

  const webcamRef = React.useRef<null | Webcam>(null)

  const capture = async () => {
    const dataUrl = webcamRef.current?.getScreenshot()
    if (!dataUrl) return
    setCandidatePic(await dataUrlToBlob(dataUrl))
    setWebcamActive(false)
  }

  const savePhoto = () => {
    if (!candidatePic) return
    props.onSave(candidatePic)
    setCandidatePic(null)
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
        <ModalHeader>Take a Selfie</ModalHeader>
        <ModalBody>
          <Stack spacing="8" align="center">
            <Box>
              <Text mb="2">
                We need a picture to make sure you're a unique human. Keep the
                following requirements in mind:
              </Text>
              <OrderedList fontSize="sm">
                <ListItem>
                  The photo should be taken <strong>from the front</strong> with
                  your face centered. Think of this like a passport photo.
                </ListItem>
                <ListItem>
                  Your <strong>whole face</strong> must be visible in the frame.
                </ListItem>
                <ListItem>
                  Remove anything that covers part of your face like{' '}
                  <strong>glasses, masks, or heavy makeup</strong> (hats or head
                  coverings that don't cover the face are ok).
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
                    screenshotFormat="image/webp"
                    ref={webcamRef}
                  />
                </Box>
                <ButtonGroup justify="center" pb="4">
                  <Button colorScheme="purple" onClick={capture}>
                    Capture Photo
                  </Button>
                  <Button onClick={() => setWebcamActive(false)}>Cancel</Button>
                </ButtonGroup>
              </>
            )}
            {candidatePic && !webcamActive && (
              <ScaleFade in={candidatePic && !webcamActive}>
                <Stack spacing="8" align="center">
                  <Image
                    shadow="md"
                    src={URL.createObjectURL(candidatePic)}
                    alt="Candidate picture"
                    borderRadius="lg"
                  />
                  <ButtonGroup justify="center" pb="4">
                    <Button colorScheme="blue" onClick={savePhoto}>
                      Use This
                    </Button>
                    <Button onClick={() => setCandidatePic(null)}>
                      Choose Another
                    </Button>
                  </ButtonGroup>
                </Stack>
              </ScaleFade>
            )}
            {!candidatePic && !webcamActive && (
              <ButtonGroup justify="center" pb="4">
                <Button onClick={openFileSelector} colorScheme="gray">
                  Upload Picture
                </Button>
                <Button
                  onClick={() => setWebcamActive(true)}
                  colorScheme="purple"
                >
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

const PhotoField: React.FC<{readOnly?: boolean}> = (props) => {
  const {readOnly = false} = props
  const modalControl = useDisclosure()

  const {control} = useFormContext<SignupFieldValues>()
  const {field} = useController({
    name: 'photoCid',
    control,
    rules: {required: true},
  })

  return (
    <>
      <PhotoModal
        modalCtrl={modalControl}
        onSave={(pic) => field.onChange(pic)}
      />
      {field.value ? (
        <Stack>
          <PhotoBox photo={field.value as Blob} width="36" shadow="lg" />
          {!readOnly && (
            <Link
              as="button"
              type="button"
              variant="btn"
              onClick={modalControl.onOpen}
            >
              Change
            </Link>
          )}
        </Stack>
      ) : (
        <Button onClick={modalControl.onOpen}>Take Selfie</Button>
      )}
    </>
  )
}

export default PhotoField
