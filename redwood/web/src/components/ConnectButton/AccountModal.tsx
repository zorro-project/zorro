import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import {useUser} from 'src/layouts/UserContext'

export default function AccountModal({
  control,
}: {
  control: UseDisclosureReturn
}) {
  const {connectedAddress} = useUser()
  if (!connectedAddress) return null

  return (
    <Modal
      isOpen={control.isOpen}
      onClose={control.onClose}
      isCentered
      size="md"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Connected account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex alignItems="center" mt={2} mb={4} lineHeight={1}>
            <Text fontSize="md" ml="2" lineHeight="1.1" wordBreak="break-all">
              {connectedAddress}
            </Text>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
