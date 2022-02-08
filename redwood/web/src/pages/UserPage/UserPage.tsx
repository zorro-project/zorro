import {Heading, Stack, Table, Tbody, Td, Th, Tr} from '@chakra-ui/react'
import {MetaTags} from '@redwoodjs/web'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {useUser} from 'src/layouts/UserContext'

const AuthenticatePage: React.FC<{next?: string}> = () => {
  const {connectedAddress, user, loading} = useUser()

  if (loading) return null

  return (
    <Stack
      alignSelf="center"
      alignItems="center"
      justifyContent="center"
      width="lg"
      maxW="100%"
      backgroundColor="white"
      shadow="md"
      padding={8}
    >
      <MetaTags title="User Details" />
      {!connectedAddress && <ConnectButton variant="register-primary" />}

      {connectedAddress && (
        <>
          <Heading size="md">Connected User</Heading>
          <Table>
            <Tbody>
              <Tr>
                <Th>Connected Address</Th>
                <Td wordBreak="break-all">{connectedAddress}</Td>
              </Tr>
              <Tr>
                <Th>Derived Address</Th>
                <Td wordBreak="break-all">{user?.ethereumAddress}</Td>
              </Tr>
              <Tr>
                <Th>Roles</Th>
                <Td>
                  {user?.roles.length ?? 0 > 0
                    ? user?.roles.join(', ')
                    : 'None'}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}
    </Stack>
  )
}

export default AuthenticatePage
