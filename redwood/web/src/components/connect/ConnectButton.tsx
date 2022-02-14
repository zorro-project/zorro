import {Button, Stack, Text, useDisclosure, useToast} from '@chakra-ui/react'
import {isMobile} from 'react-device-detect'
import Identicon from 'src/components/Identicon'
import {useUser} from 'src/layouts/UserContext'
import {track} from 'src/lib/posthog'
import {useAccount, useConnect} from 'wagmi'
import AccountPanel from 'src/components/connect/AccountPanel'
import AuthenticatePanel from './AuthenticatePanel'
import connectors from './connectors'
import ConnectPanel from './ConnectPanel'

export default function ConnectButton() {
  const user = useUser()
  const accountPanelCtrl = useDisclosure()
  const connectPanelCtrl = useDisclosure()
  const authenticatePanelCtrl = useDisclosure()

  const connect = useConnect()
  const [account] = useAccount()
  const toast = useToast()

  const isLoading = connectPanelCtrl.isOpen || authenticatePanelCtrl.isOpen
  const connectedAddress = account?.data?.address

  if (
    connectedAddress &&
    (user.auth.isAuthenticated || user.auth.loading) &&
    !isLoading
  )
    return (
      <Button variant="outline" onClick={accountPanelCtrl.onOpen} size="sm">
        <Stack direction="row" alignItems="center">
          <Text fontWeight="bold">
            {connectedAddress.slice(0, 6)}...
            {connectedAddress.slice(
              connectedAddress.length - 4,
              connectedAddress.length
            )}
          </Text>
          <Identicon account={connectedAddress} />
          <AccountPanel control={accountPanelCtrl} />
        </Stack>
      </Button>
    )
  return (
    <Button
      onClick={async () => {
        track('connect button pressed')

        // If you're already connected, open the authenticate panel
        if (account?.data?.address) return authenticatePanelCtrl.onOpen()

        if (isMobile) {
          // On mobile only support WalletConnect for now for simplicity.
          try {
            const resp = await connect[1](connectors.walletConnect)
            // If we connected successfully, open the AuthenticatePanel.
            if (resp?.data) {
              track('connected successfully')
              authenticatePanelCtrl.onOpen()
            }
          } catch (e) {
            toast({status: 'error', title: e.message})
          }
        } else {
          connectPanelCtrl.onOpen()
        }
      }}
      isLoading={isLoading}
      size="sm"
    >
      Connect Wallet
      <ConnectPanel
        control={connectPanelCtrl}
        connect={connect}
        onSuccess={authenticatePanelCtrl.onOpen}
      />
      <AuthenticatePanel control={authenticatePanelCtrl} />
    </Button>
  )
}
