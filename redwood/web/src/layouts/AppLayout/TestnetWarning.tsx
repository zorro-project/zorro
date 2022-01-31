import {Alert, Text} from '@chakra-ui/react'

const deployment = process.env.CHAIN_DEPLOYMENT

const TestnetWarning = () => {
  if (deployment === 'staging') {
    return (
      <Alert display="flex" justifyContent="center" status="warning">
        <Text>
          This is an alpha testnet deployment of Zorro which is only for testing
          purposes. Registrations may be reset periodically.
        </Text>
      </Alert>
    )
  }

  if (['production', 'development', 'test'].includes(deployment)) return null

  return (
    <Alert status="error">Unexpected CHAIN_DEPLOYMENT "{deployment}"</Alert>
  )
}

export default TestnetWarning
