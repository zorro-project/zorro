import {useState} from 'react'
import {Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import ConnectButton, {
  reconnect,
} from 'src/components/ConnectButton/ConnectButton'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import RegisterScreen from '../RegisterScreen'
import useAsyncEffect from 'use-async-effect'

import {Alert, AlertIcon, AlertTitle, AlertDescription} from '@chakra-ui/react'
import {requireNoExistingProfile} from 'src/lib/guards'

const AddressAlert = () => (
  <Alert
    status="info"
    variant="subtle"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    height="200px"
  >
    <AlertIcon boxSize="40px" mr={0} />
    <AlertTitle mt={4} mb={1} fontSize="lg">
      Please make a fresh address
    </AlertTitle>
    <AlertDescription maxWidth="sm">
      Creating a fresh address protects your privacy. When Metamask pops up,
      click 'New Account'
    </AlertDescription>
  </Alert>
)

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  requireNoExistingProfile()

  const {connectedAddress} = useUser()
  useGuard(!connectedAddress, routes.registerAllowCamera())

  return (
    <RegisterScreen
      shouldHideTitle
      title="Connect wallet"
      buttonDescription={
        // XXX: You don't need a new address anymore. Should we remove this screen entirely?
        <Text>
          To protect your privacy, connect an Ethereum wallet and{' '}
          <strong>create a new address</strong>.
        </Text>
      }
      PrimaryButtonComponent={!connectedAddress ? ConnectButton : undefined}
      primaryButtonLabel="Connect wallet"
    />
  )
}

export default ConnectWalletPage
