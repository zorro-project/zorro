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
import {useContext} from 'react'
import Identicon from 'src/components/Identicon'
import UserContext from 'src/layouts/UserContext'

type Props = {
  isOpen: any
  onClose: any
}

export default function AccountModal({isOpen, onClose}: Props) {
  const {ethereumAddress} = useContext(UserContext)

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm">Connected with MetaMask</Text>
          <Flex alignItems="center" mt={2} mb={4} lineHeight={1}>
            <Identicon account={ethereumAddress} />
            <Text
              fontSize="xl"
              fontWeight="semibold"
              ml="2"
              lineHeight="1.1"
              wordBreak="break-all"
            >
              {ethereumAddress}
            </Text>
          </Flex>
          <Link
            fontSize="sm"
            display="flex"
            alignItems="center"
            href={`https://etherscan.io/address/${ethereumAddress}`}
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
