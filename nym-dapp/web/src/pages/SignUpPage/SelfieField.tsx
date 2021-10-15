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
import { useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import Webcam from 'react-webcam'
import { useFilePicker } from 'use-file-picker'

const SelfieModal = (props: {
  modalCtrl: UseDisclosureReturn
  onSave: (newPhoto: string) => void
}) => {
  const [webcamActive, setwebcamActive] = useState<boolean>(false)
  const [candidatePic, setCandidatePic] = useState<string | null>(null)

  const [openFileSelector, { filesContent }] = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: true,
    limitFilesConfig: { max: 1 },
    // minFileSize: 0.1, // in megabytes
    // maxFileSize: 5,
    // imageSizeRestrictions: {
    //   minHeight: 600,
    //   minWidth: 768,
    // },
  })

  React.useEffect(() => {
    if (filesContent.length < 1) return
    setCandidatePic(filesContent[0].content)
  }, [filesContent])

  const webcamRef = React.useRef(null)

  const capture = () => {
    setCandidatePic(webcamRef.current.getScreenshot())
    setwebcamActive(false)
  }

  const saveSelfie = () => {
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
                    videoConstraints={{ facingMode: 'user' }}
                    screenshotFormat="image/webp"
                    ref={webcamRef}
                  />
                </Box>
                <ButtonGroup justify="center" pb="4">
                  <Button colorScheme="teal" onClick={capture}>
                    Capture Photo
                  </Button>
                  <Button onClick={() => setwebcamActive(false)}>Cancel</Button>
                </ButtonGroup>
              </>
            )}
            {candidatePic && !webcamActive && (
              <ScaleFade in={candidatePic && !webcamActive}>
                <Stack spacing="8" align="center">
                  <Image
                    shadow="md"
                    src={candidatePic}
                    alt="Candidate picture"
                    borderRadius="lg"
                  />
                  <ButtonGroup justify="center" pb="4">
                    <Button colorScheme="blue" onClick={saveSelfie}>
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
              <ButtonGroup justify="center" colorScheme="teal" pb="4">
                <Button onClick={openFileSelector}>Upload Picture</Button>
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

const Selfie = () => {
  const modalControl = useDisclosure()

  const { control } = useFormContext()
  const fieldController = useController({
    name: 'userSelfie',
    control,
    rules: { required: true },
  })
  const currentPic: string | null = fieldController.field.value

  return (
    <>
      <SelfieModal
        modalCtrl={modalControl}
        onSave={(pic) => fieldController.field.onChange(pic)}
      />
      {currentPic ? (
        <Stack>
          <Image src={currentPic} width="36" borderRadius="lg" shadow="lg" />
          <Link as="button" variant="btn" onClick={modalControl.onOpen}>
            Change
          </Link>
        </Stack>
      ) : (
        <Button onClick={modalControl.onOpen}>Take Selfie</Button>
      )}
    </>
  )
}

export default Selfie
