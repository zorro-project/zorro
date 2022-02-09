import {
  Button,
  ButtonProps,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import Identicon from 'src/components/Identicon'
import {useUser} from 'src/layouts/UserContext'
import {track} from 'src/lib/posthog'
import AccountModal from './AccountModal'

const NoMetamask = ({control}: {control: UseDisclosureReturn}) => (
  <Modal isOpen={control.isOpen} onClose={control.onClose} isCentered>
    <ModalOverlay />
    <ModalContent p={4}>
      <ModalHeader>Please install a browser wallet</ModalHeader>
      <ModalCloseButton />

      <ModalBody>
        <Stack spacing={4}>
          <Text>
            Zorro needs a browser crypto wallet to work, and we can't detect
            one. 😧 Please{' '}
            <Link
              href="https://metamask.io/"
              onClick={() => track('clicked install metamask')}
              isExternal
              fontWeight="bold"
            >
              install MetaMask
            </Link>{' '}
            and come back.
          </Text>
          <Text>
            Supporting more wallets is a high priority. Let us know{' '}
            <Link
              href="https://discord.com/channels/905249020576944139/940975443790684170"
              isExternal
              onClick={() => track('clicked discord feedback')}
            >
              on Discord
            </Link>{' '}
            if you need another wallet type so we can ping you when that's
            ready! 🙏
          </Text>
        </Stack>
      </ModalBody>
    </ModalContent>
  </Modal>
)

export default function ConnectButton(props: ButtonProps) {
  const user = useUser()
  const accountModalControl = useDisclosure()
  const noMetamaskModalControl = useDisclosure()

  const isLoading = user.isAuthenticating || props.isLoading

  return user.connectedAddress &&
    (user.auth.isAuthenticated || user.auth.loading) &&
    !isLoading ? (
    <>
      <Stack>
        <AccountModal control={accountModalControl} />
        <Button variant="outline" onClick={accountModalControl.onOpen}>
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
    <>
      <Button
        onClick={() => {
          track('connect button pressed')
          if (typeof web3 == 'undefined') {
            track('no injected connector')
            noMetamaskModalControl.onOpen()
          } else {
            user.onConnectButtonPressed()
          }
        }}
        // eslint-disable-next-line react/no-children-prop
        children="Connect Wallet"
        {...props}
      />
      <NoMetamask control={noMetamaskModalControl} />
    </>
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
