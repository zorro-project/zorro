import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {useUser} from 'src/layouts/UserContext'

export default function AuthenticatePanel({
  control,
}: {
  control: UseDisclosureReturn
}) {
  const {onAuthenticate, loading} = useUser()
  const [authError, setAuthError] = useState<string | undefined>()

  const onAuthenticateButtonPressed = async () => {
    try {
      await onAuthenticate()
      control.onClose()
    } catch (e) {
      setAuthError(e.message)
    }
  }

  useEffect(() => {
    if (!control.isOpen) setAuthError(undefined)
  }, [control.isOpen])

  return (
    <Modal
      isOpen={control.isOpen}
      onClose={control.onClose}
      isCentered
      size="md"
    >
      <ModalOverlay />
      <ModalContent p={8}>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Authenticate
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            <Text>
              To protect the privacy of your connected wallet, we need you to
              authenticate yourself by signing a string. We'll use the signature
              to create a derived wallet that you'll use to interact with your
              Zorro account. This way your on-chain activity won't be linked to
              your public Zorro identity.
            </Text>
            <Button
              mt={4}
              colorScheme="purple"
              onClick={onAuthenticateButtonPressed}
              isLoading={loading}
            >
              Authenticate
            </Button>
            {authError && (
              <Alert mt={4} status="error">
                {authError}
              </Alert>
            )}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
