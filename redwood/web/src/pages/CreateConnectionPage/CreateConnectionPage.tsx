import {Box, Heading, Text} from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import {useMutation} from '@redwoodjs/web'
import {useCallback} from 'react'
import {CreateConnectionMutation} from 'types/graphql'
import {useSigner} from 'wagmi'
import {load as loadIntendedConnection} from '../../lib/intendedConnectionStorage'
const CreateConnectionPage = () => {
  const [{data: signer}] = useSigner()

  const intendedConnection = loadIntendedConnection()
  //if (account == null) return <Redirect to={routes.createProfile()} />
  const [createConnection] = useMutation<CreateConnectionMutation>(gql`
    mutation CreateConnectionMutation($input: CreateConnectionInput!) {
      createConnection(input: $input) {
        purposeIdentifier
        externalAddress
      }
    }
  `)

  const connect = useCallback(async () => {
    console.log(signer, intendedConnection?.purposeIdentifier)
    if (signer == null || intendedConnection == null) return

    let signature = null

    try {
      // XXX: dedup message with backend
      const message = `Connect Zorro to ${intendedConnection?.externalAddress}`
      signature = await signer.signMessage(message)
    } catch (error) {
      if (error.code === 4001) {
        // user denied signature
      } else {
        throw error
      }
    }

    console.log('signature', signature)

    await createConnection({
      variables: {
        input: {
          signature,
          purposeIdentifier: intendedConnection.purposeIdentifier,
          externalAddress: intendedConnection.externalAddress,
        },
      },
    })
  }, [signer, intendedConnection, createConnection])

  return (
    <Box maxW="xl" mx="auto">
      <Heading size="lg" pb="4">
        Connect
      </Heading>
      <Text>Intended connection: {JSON.stringify(intendedConnection)}</Text>
      {/* XXX: handle missing intended connection */}
      <Button onClick={connect} colorScheme="blue">
        Connect
      </Button>
    </Box>
  )
}

export default CreateConnectionPage
