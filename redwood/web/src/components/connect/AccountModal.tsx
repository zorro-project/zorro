import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Th,
  Tr,
  UseDisclosureReturn,
  Stack,
  Text,
} from '@chakra-ui/react'
import {useUser} from 'src/layouts/UserContext'
import {useAccount} from 'wagmi'

export default function AccountModal({
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
          Connected Account
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
                    <Th>Roles</Th>
                    <Td>{user?.roles.join(', ')}</Td>
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
