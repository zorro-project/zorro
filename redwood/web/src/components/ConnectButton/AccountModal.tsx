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
  UseDisclosureReturn,
} from '@chakra-ui/react'
import Identicon from 'src/components/Identicon'
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
          Account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm">Connected with MetaMask</Text>
          <Flex alignItems="center" mt={2} mb={4} lineHeight={1}>
            <Identicon account={connectedAddress} />
            <Text
              fontSize="xl"
              fontWeight="semibold"
              ml="2"
              lineHeight="1.1"
              wordBreak="break-all"
            >
              {connectedAddress}
            </Text>
          </Flex>
          <Link
            fontSize="sm"
            display="flex"
            alignItems="center"
            href={`https://etherscan.io/address/${connectedAddress}`}
            isExternal
            color="gray.600"
          >
            <ExternalLinkIcon mr={1} />
            View on Explorer
          </Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
