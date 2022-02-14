import {Stack, Text} from '@chakra-ui/layout'
import {Alert, useDisclosure} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {useState} from 'react'
import {isMobile} from 'react-device-detect'
import connectors from 'src/components/connect/connectors'
import ConnectPanel from 'src/components/connect/ConnectPanel'
import {useUser} from 'src/layouts/UserContext'
import {requireNoExistingProfile} from 'src/lib/guards'
import {useGuard} from 'src/lib/useGuard'
import {useAccount, useConnect} from 'wagmi'
import RegisterScreen from '../RegisterScreen'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  requireNoExistingProfile()

  const {auth, onAuthenticate, loading} = useUser()
  const [account] = useAccount()
  const connect = useConnect()
  const [authError, setAuthError] = useState<string | undefined>()
  const connectPanelCtrl = useDisclosure()

  useGuard(!auth.isAuthenticated, routes.registerAllowCamera())

  const onAuthenticateButtonPressed = async () => {
    try {
      await onAuthenticate()
    } catch (e) {
      setAuthError(e.message)
    }
  }

  if (!account.data?.address) {
    return (
      <RegisterScreen
        title="Connect wallet"
        buttonDescription={
          <Text>
            To protect your privacy, your ethereum address will not be revealed
            to anyone.
          </Text>
        }
        primaryButtonLabel={'Connect wallet'}
        primaryButtonProps={{
          onClick: () =>
            isMobile
              ? connect[1](connectors.walletConnect)
              : connectPanelCtrl.onOpen(),
          isLoading: connectPanelCtrl.isOpen,
        }}
      >
        <ConnectPanel control={connectPanelCtrl} connect={connect} />
      </RegisterScreen>
    )
  }
  return (
    <RegisterScreen
      title="Protect privacy"
      primaryButtonLabel="Generate private account"
      buttonDescription={
        <Stack>
          <Text>
            This step generates a new account in order to keep your connected
            Ethereum address private.
          </Text>
          {authError && (
            <Alert mt={4} status="error">
              {authError}
            </Alert>
          )}
        </Stack>
      }
      primaryButtonProps={{
        onClick: onAuthenticateButtonPressed,
        isLoading: loading,
      }}
    />
  )
}

export default ConnectWalletPage
