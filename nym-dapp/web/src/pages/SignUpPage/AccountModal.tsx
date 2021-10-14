import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
} from '@chakra-ui/react'
import { ExternalLinkIcon, CopyIcon } from '@chakra-ui/icons'
import { useEthers } from '@usedapp/core'
import Identicon from './Identicon'

type Props = {
  isOpen: any
  onClose: any
}

export default function AccountModal({ isOpen, onClose }: Props) {
  const { account, deactivate } = useEthers()

  function handleDeactivateAccount() {
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
        <ModalBody pt={0} px={4}>
          <Box
            borderRadius="3xl"
            border="1px"
            borderStyle="solid"
            borderColor="gray.600"
            px={5}
            pt={4}
            pb={2}
            mb={3}
          >
            <Flex justifyContent="space-between" alignItems="center" mb={3}>
              <Text fontSize="sm">Connected with MetaMask</Text>
              <Button
                variant="outline"
                size="sm"
                borderRadius="3xl"
                fontSize="13px"
                fontWeight="normal"
                px={2}
                height="26px"
                onClick={handleDeactivateAccount}
              >
                Change
              </Button>
            </Flex>
            <Flex alignItems="center" mt={2} mb={4} lineHeight={1}>
              <Identicon />
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
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
