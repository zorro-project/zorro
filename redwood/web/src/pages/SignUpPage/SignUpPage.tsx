import {Alert, AlertDescription, AlertIcon} from '@chakra-ui/alert'
import {Box, Heading, ListItem, OrderedList, Text} from '@chakra-ui/layout'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useEthers} from '@usedapp/core'
import {useEffect} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import ipfsClient from 'src/lib/ipfs'

import {
  save as saveIntendedConnection,
  load as loadIntendedConnection,
} from '../../lib/intendedConnectionStorage'

const SignUpPage = ({purposeIdentifier, externalAddress}) => {
  const {account} = useEthers()

  useEffect(() => {
    if (purposeIdentifier && externalAddress) {
      saveIntendedConnection({purposeIdentifier, externalAddress})
    }
  }, [])

  if (account != null) return <Redirect to={routes.createProfile()} />

  return (
    <Box maxW="xl" mx="auto">
      <MetaTags title="Sign Up" />
      <Heading size="lg" pb="4">
        Sign Up for Zorro
      </Heading>
      <Text>
        <strong>Zorro</strong> is a new way to prove to Dapps that you're a real
        person, while preserving your privacy. It works like this:
      </Text>
      <OrderedList py="4" px="4">
        <ListItem>
          First you create a public <strong>Zorro profile</strong>. Your Zorro
          profile is linked to your real identity, and each person can only
          create a single profile.
        </ListItem>
        <ListItem>
          Once your profile is complete, you'll be able to create one or more{' '}
          <strong>Zorro aliases</strong>. Zorro aliases are private pseudonyms
          you can use to demonstrate that you're a real, unique human, without
          disclosing exactly <em>which</em> human you are.
        </ListItem>
      </OrderedList>
      <Text>To get started, just connect an Ethereum wallet.</Text>
      <ConnectButton colorScheme="blue" my="8" width="100%">
        Connect my wallet!
      </ConnectButton>
      <Alert status="warning">
        <AlertIcon />
        <AlertDescription fontSize="sm">
          Note: the wallet you choose will be linked to your real identity, so
          use a new one or one you don't mind revealing publicly.
        </AlertDescription>
      </Alert>
    </Box>
  )
}

export default SignUpPage
