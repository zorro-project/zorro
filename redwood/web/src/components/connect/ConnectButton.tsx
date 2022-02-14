import {Button, Stack, Text, useDisclosure} from '@chakra-ui/react'
import {isMobile} from 'react-device-detect'
import Identicon from 'src/components/Identicon'
import {useUser} from 'src/layouts/UserContext'
import {track} from 'src/lib/posthog'
import {useAccount, useConnect} from 'wagmi'
import AccountModal from './AccountModal'
import AuthenticatePanel from './AuthenticatePanel'
import ConnectPanel from './ConnectPanel'

export default function ConnectButton() {
  const user = useUser()
  const accountModalCtrl = useDisclosure()
  const connectPanelCtrl = useDisclosure()
  const authenticatePanelCtrl = useDisclosure()

  const connect = useConnect()
  const [account] = useAccount()

  const isLoading = connectPanelCtrl.isOpen || authenticatePanelCtrl.isOpen
  const connectedAddress = account?.data?.address

  if (
    connectedAddress &&
    (user.auth.isAuthenticated || user.auth.loading) &&
    !isLoading
  )
    return (
      <Button variant="outline" onClick={accountModalCtrl.onOpen} size="sm">
        <Stack direction="row" alignItems="center">
          <Text fontWeight="bold">
            {connectedAddress.slice(0, 6)}...
            {connectedAddress.slice(
              connectedAddress.length - 4,
              connectedAddress.length
            )}
          </Text>
          <Identicon account={connectedAddress} />
          <AccountModal control={accountModalCtrl} />
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
          connect[1](connect[0].data.connectors[1])
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
