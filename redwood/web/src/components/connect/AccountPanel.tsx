import {
  Button,
  Link,
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
import {routes} from '@redwoodjs/router'
import {useUser} from 'src/layouts/UserContext'
import {useAccount} from 'wagmi'
import {RLink} from 'src/components/links'

export default function AccountModal({
  control,
}: {
  control: UseDisclosureReturn
}) {
  const [account, disconnect] = useAccount()
  if (!account?.data?.address) return null
  const {user, cachedProfile} = useUser()

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
          Connected Account
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {account.data.address && (
            <Table>
              <Tbody>
                <Tr>
                  <Th>Connected Address</Th>
                  <Td wordBreak="break-all">
                    <Stack>
                      <Text>{account.data.address}</Text>
                      <Button onClick={disconnect}>Disconnect</Button>
                    </Stack>
                  </Td>
                </Tr>
                <Tr>
                  <Th>Derived Address</Th>
                  <Td wordBreak="break-all">{user?.ethereumAddress}</Td>
                </Tr>
                {cachedProfile && (
                  <Tr>
                    <Th>Registered Profile</Th>
                    <Td>
                      <Link
                        as={RLink}
                        href={routes.profilePage({id: cachedProfile.id})}
                      >
                        Profile {cachedProfile.id}
                      </Link>
                    </Td>
                  </Tr>
                )}
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
