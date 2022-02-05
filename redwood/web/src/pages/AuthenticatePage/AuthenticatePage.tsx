import {
  Button,
  Heading,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Tr,
} from '@chakra-ui/react'
import {useAuth} from '@redwoodjs/auth'
import {navigate} from '@redwoodjs/router'
import {MetaTags, useMutation} from '@redwoodjs/web'
import dayjs from 'dayjs'
import {useCallback, useState} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {useUser} from 'src/layouts/UserContext'
import {RequestSessionToken, RequestSessionTokenVariables} from 'types/graphql'
import {useSigner} from 'wagmi'

const AuthenticatePage: React.FC<{next?: string}> = ({next}) => {
  const {logIn, logOut} = useAuth()
  const {ethereumAddress, authenticatedUser, loading} = useUser()
  const [{data: signer}] = useSigner()
  const [authenticating, setAuthenticating] = useState(false)

  const [requestSessionToken] = useMutation<
    RequestSessionToken,
    RequestSessionTokenVariables
  >(gql`
    mutation RequestSessionToken(
      $ethereumAddress: String!
      $expiresAt: String!
      $signature: String!
    ) {
      requestSessionToken(
        ethereumAddress: $ethereumAddress
        expiresAt: $expiresAt
        signature: $signature
      )
    }
  `)

  const authenticate = useCallback(async () => {
    if (!ethereumAddress) return
    setAuthenticating(true)

    try {
      if (!signer)
        return alert('Could not detect signer, is Metamask installed?')

      const expiresAt = dayjs().add(14, 'days').toISOString()
      const signature = await signer.signMessage(expiresAt)

      if (!signature) return alert('Signature not complete')

      const sessionTokenRequest = await requestSessionToken({
        variables: {ethereumAddress, expiresAt, signature},
      })

      if (!sessionTokenRequest.data) return alert('requestSessionToken error')
      logIn({token: sessionTokenRequest.data?.requestSessionToken})

      if (next) navigate(next)
    } finally {
      setAuthenticating(false)
    }
  }, [signer])

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
      <MetaTags title="Authenticate" />
      {!ethereumAddress && <ConnectButton variant="register-primary" />}
      {ethereumAddress && !authenticatedUser && (
        <Button
          isLoading={authenticating}
          onClick={authenticate}
          variant="register-primary"
        >
          Authenticate
        </Button>
      )}

      {ethereumAddress && authenticatedUser && (
        <>
          <Heading size="md">Authenticated User</Heading>
          <Table>
            <Tbody>
              <Tr>
                <Th>Eth Address</Th>
                <Td wordBreak="break-all">
                  {authenticatedUser.ethereumAddress}
                </Td>
              </Tr>
              <Tr>
                <Th>Roles</Th>
                <Td>
                  {authenticatedUser.roles.length > 0
                    ? authenticatedUser.roles.join(', ')
                    : 'None'}
                </Td>
              </Tr>
            </Tbody>
          </Table>
          <Button onClick={logOut}>Sign out</Button>
        </>
      )}
    </Stack>
  )
}

export default AuthenticatePage
