import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import RegisterLogo from '../RegisterLogo'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress, unsubmittedProfile} = useUser()
  useGuard(!unsubmittedProfile, routes.registerSubmitted())
  useGuard(!ethereumAddress, routes.registerAllowCamera())

  return (
    <Stack spacing="6" flex="1">
      <MetaTags title="Connect Wallet" />
      <RegisterLogo />
      <Spacer />
      <Text>
        To protect your privacy, connect an Ethereum wallet and{' '}
        <strong>create a new address</strong>.
      </Text>
      <ConnectButton variant="register-primary" my="8">
        Connect wallet
      </ConnectButton>
    </Stack>
  )
}

export default ConnectWalletPage
