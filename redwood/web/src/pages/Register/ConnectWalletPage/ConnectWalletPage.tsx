import {Spacer, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import UserContext from 'src/layouts/UserContext'
import {useNav} from 'src/lib/util'
import RegisterLogo from '../RegisterLogo'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress, unsubmittedProfile} = useContext(UserContext)
  if (unsubmittedProfile != null)
    return useNav(routes.registerSubmitted(), {replace: true})

  if (ethereumAddress != null)
    return useNav(routes.registerAllowCamera(), {replace: true})

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
