import {ExternalLinkIcon} from '@chakra-ui/icons'
import {
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'
import {useUser} from 'src/layouts/UserContext'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function AccountModal({isOpen, onClose}: Props) {
  const {connectedAddress} = useUser()
  if (!connectedAddress) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
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
