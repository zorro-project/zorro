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
import {useCallback, useState} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {useUser} from 'src/layouts/UserContext'
import {
  RequestSessionAuthString,
  RequestSessionAuthStringVariables,
  RequestSessionToken,
  RequestSessionTokenVariables,
} from 'types/graphql'
import {useSigner} from 'wagmi'

const AuthenticatePage: React.FC<{next?: string}> = ({next}) => {
  const {logIn, logOut} = useAuth()
  const {ethereumAddress, authenticatedUser, loading} = useUser()
  const [{data: signer}] = useSigner()
  const [authenticating, setAuthenticating] = useState(false)

  const [requestSessionAuthString] = useMutation<
    RequestSessionAuthString,
    RequestSessionAuthStringVariables
  >(gql`
    mutation RequestSessionAuthString($ethereumAddress: String!) {
      requestSessionAuthString(ethereumAddress: $ethereumAddress)
    }
  `)

  const [requestSessionToken] = useMutation<
    RequestSessionToken,
    RequestSessionTokenVariables
  >(gql`
    mutation RequestSessionToken(
      $ethereumAddress: String!
      $signature: String!
    ) {
      requestSessionToken(
        ethereumAddress: $ethereumAddress
        signature: $signature
      )
    }
  `)

  const authenticate = useCallback(async () => {
    if (!ethereumAddress) return
    setAuthenticating(true)

    try {
      const authStringRequest = await requestSessionAuthString({
        variables: {ethereumAddress},
      })

      if (!authStringRequest.data)
        return alert('requestSessionAuthString error')

      if (!signer)
        return alert('Could not detect signer, is Metamask installed?')
      const signature = await signer.signMessage(
        authStringRequest.data.requestSessionAuthString
      )

      if (!signature) return alert('Signature not complete')

      const sessionTokenRequest = await requestSessionToken({
        variables: {ethereumAddress, signature},
      })

      if (!sessionTokenRequest.data) return alert('requestSessionToken error')
      logIn({token: sessionTokenRequest.data?.requestSessionToken})

      if (next) navigate(next)
    } finally {
      setAuthenticating(false)
    }
  }, [signer])

  console.log({loading})
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
