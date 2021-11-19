import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Button,
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
import { useEthers } from '@usedapp/core'
import Identicon from 'src/components/Identicon'

type Props = {
  isOpen: any
  onClose: any
}

export default function AccountModal({ isOpen, onClose }: Props) {
  const { account, deactivate } = useEthers()

  function handleDeactivateAccount() {
    // Deactivate is kinda broken right now unfortunately. After refreshing the
    // page the user is still signed in (!)
    // https://github.com/EthWorks/useDApp/issues/273
    deactivate()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Text fontSize="sm">Connected with MetaMask</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivateAccount}
            >
              Disconnect
            </Button>
          </Flex>
          <Flex alignItems="center" mt={2} mb={4} lineHeight={1}>
            <Identicon account={account} />
            <Text
              fontSize="xl"
              fontWeight="semibold"
              ml="2"
              lineHeight="1.1"
              wordBreak="break-all"
            >
              {account}
            </Text>
          </Flex>
          <Link
            fontSize="sm"
            display="flex"
            alignItems="center"
            href={`https://etherscan.io/address/${account}`}
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
