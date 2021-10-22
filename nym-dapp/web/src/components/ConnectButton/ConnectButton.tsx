import {
  Button,
  Stack,
  Text,
  useDisclosure,
  ButtonProps,
} from '@chakra-ui/react'
import { useEthers } from '@usedapp/core'
import AccountModal from './AccountModal'
import Identicon from './Identicon'

// Adapted from https://dev.to/jacobedawson/build-a-web3-dapp-in-react-login-with-metamask-4chp

export default function ConnectButton(props: ButtonProps) {
  const ethers = useEthers()
  const modalControl = useDisclosure()

  const signIn = async () => {
    ethers.activateBrowserWallet()
  }

  return ethers.account ? (
    <>
      <Stack>
        <AccountModal
          isOpen={modalControl.isOpen}
          onClose={modalControl.onClose}
        />
        <Button variant="outline" onClick={modalControl.onOpen}>
          <Stack direction="row" alignItems="center">
            <Text fontWeight="bold">
              {ethers.account.slice(0, 6)}...
              {ethers.account.slice(
                ethers.account.length - 4,
                ethers.account.length
              )}
            </Text>
            <Identicon />
          </Stack>
        </Button>
      </Stack>
    </>
  ) : (
    <Button
      onClick={signIn}
      // eslint-disable-next-line react/no-children-prop
      children="Sign In"
      {...props}
    />
  )
}