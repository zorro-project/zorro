import {Spacer, Text, VStack} from '@chakra-ui/layout'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import UserContext from 'src/layouts/UserContext'
import SignUpLogo from '../SignUpLogo'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (ethereumAddress != null) return <Redirect to={routes.signUpEdit()} />

  return (
    <VStack maxW="md" mx="auto" spacing="6">
      <SignUpLogo />
      <MetaTags title="Sign Up" />
      <Spacer display={['initial', 'none']} />
      <Text>
        To protect your privacy, connect an Ethereum wallet and{' '}
        <strong>create a new address</strong>.
      </Text>
      <ConnectButton colorScheme="purple" my="8">
        Connect wallet
      </ConnectButton>
    </VStack>
  )
}

export default ConnectWalletPage
