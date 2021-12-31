import {Button, Stack, Text, useDisclosure, ButtonProps} from '@chakra-ui/react'
import {useEthers} from '@usedapp/core'
import AccountModal from './AccountModal'
import Identicon from 'src/components/Identicon'
import UserContext from 'src/layouts/UserContext'

// Adapted from https://dev.to/jacobedawson/build-a-web3-dapp-in-react-login-with-metamask-4chp

export default function ConnectButton(props: ButtonProps) {
  const user = React.useContext(UserContext)
  const ethers = useEthers()
  const modalControl = useDisclosure()

  const signIn = async () => {
    ethers.activateBrowserWallet()
  }

  return user.ethereumAddress ? (
    <>
      <Stack>
        <AccountModal
          isOpen={modalControl.isOpen}
          onClose={modalControl.onClose}
        />
        <Button variant="outline" onClick={modalControl.onOpen}>
          <Stack direction="row" alignItems="center">
            <Text fontWeight="bold">
              {user.ethereumAddress.slice(0, 6)}...
              {user.ethereumAddress.slice(
                user.ethereumAddress.length - 4,
                user.ethereumAddress.length
              )}
            </Text>
            <Identicon account={user.ethereumAddress} />
          </Stack>
        </Button>
      </Stack>
    </>
  ) : (
    <Button
      onClick={signIn}
      // eslint-disable-next-line react/no-children-prop
      children="Connect Wallet"
      {...props}
    />
  )
}
