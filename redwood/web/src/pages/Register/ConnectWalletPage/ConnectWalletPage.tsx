import {Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {useUser} from 'src/layouts/UserContext'
import {requireNoExistingProfile} from 'src/lib/guards'
import {useGuard} from 'src/lib/useGuard'
import RegisterScreen from '../RegisterScreen'

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
