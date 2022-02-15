import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import {useUser} from 'src/layouts/UserContext'
import {useAccount} from 'wagmi'

export default function AccountPanel({
  control,
}: {
  control: UseDisclosureReturn
}) {
  const [account, disconnect] = useAccount()
  if (!account?.data?.address) return null
  const {user} = useUser()

  return (
    <Modal
      isOpen={control.isOpen}
      onClose={control.onClose}
      isCentered
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Connected account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {account.data.address && (
            <Table>
              <Tbody>
                <Tr>
                  <Td wordBreak="break-all">
                    <Stack>
                      <Text>{account.data.address}</Text>
                      <Button onClick={disconnect}>Disconnect</Button>
                    </Stack>
                  </Td>
                </Tr>
                {(user?.roles.length ?? 0) > 0 && (
                  <Tr>
                    <Td>Roles: {user?.roles.join(', ')}</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
