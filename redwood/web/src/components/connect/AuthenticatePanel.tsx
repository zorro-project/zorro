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
          Protect privacy
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={6}>
            <Text>
              This step generates a new account in order to keep your connected
              Ethereum address private.
            </Text>
            <Button
              colorScheme="purple"
              onClick={onAuthenticateButtonPressed}
              isLoading={loading}
            >
              Generate private account
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
