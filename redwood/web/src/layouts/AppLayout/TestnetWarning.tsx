import {Alert, Text} from '@chakra-ui/react'

const deployment = process.env.CHAIN_DEPLOYMENT

const TestnetWarning = () => {
  if (deployment === 'staging' || deployment === 'development') {
    return (
      <Alert display="flex" justifyContent="center" status="warning">
        <Text fontSize="sm">This is an alpha testnet deployment of Zorro.</Text>
      </Alert>
    )
  }

  if (['production', 'development', 'test'].includes(deployment)) return null

  return (
    <Alert status="error">Unexpected CHAIN_DEPLOYMENT "{deployment}"</Alert>
  )
}

export default TestnetWarning
