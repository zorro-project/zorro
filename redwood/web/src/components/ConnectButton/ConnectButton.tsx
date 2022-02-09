import {Button, ButtonProps, Stack, Text, useDisclosure} from '@chakra-ui/react'
import Identicon from 'src/components/Identicon'
import {useUser} from 'src/layouts/UserContext'
import AccountModal from './AccountModal'

// Adapted from https://dev.to/jacobedawson/build-a-web3-dapp-in-react-login-with-metamask-4chp

export default function ConnectButton(props: ButtonProps) {
  const user = useUser()
  const modalControl = useDisclosure()

  const isLoading = user.isAuthenticating || props.isLoading

  return user.connectedAddress &&
    (user.auth.isAuthenticated || user.auth.loading) &&
    !isLoading ? (
    <>
      <Stack>
        <AccountModal
          isOpen={modalControl.isOpen}
          onClose={modalControl.onClose}
        />
        <Button variant="outline" onClick={modalControl.onOpen} {...props}>
          <Stack direction="row" alignItems="center">
            <Text fontWeight="bold">
              {user.connectedAddress.slice(0, 6)}...
              {user.connectedAddress.slice(
                user.connectedAddress.length - 4,
                user.connectedAddress.length
              )}
            </Text>
            <Identicon account={user.connectedAddress} />
          </Stack>
        </Button>
      </Stack>
    </>
  ) : (
    <Button
      onClick={user.onConnectButtonPressed}
      isLoading={isLoading}
      // eslint-disable-next-line react/no-children-prop
      children="Connect Wallet"
      {...props}
    />
  )
}

// wagmi doesn't support forcing a reconnection, so we're stubbing this in.
export async function reconnect() {
  await window.ethereum?.request({
    // @ts-ignore
    method: 'wallet_requestPermissions',
    // @ts-ignore
    params: [{eth_accounts: {}}],
  })
}
