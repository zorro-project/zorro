import {Button, ButtonProps, Stack, Text, useDisclosure} from '@chakra-ui/react'
import Identicon from 'src/components/Identicon'
import {useUser} from 'src/layouts/UserContext'
import {useConnect} from 'wagmi'
import AccountModal from './AccountModal'

// Adapted from https://dev.to/jacobedawson/build-a-web3-dapp-in-react-login-with-metamask-4chp

export default function ConnectButton(props: ButtonProps) {
  const user = useUser()
  const modalControl = useDisclosure()

  const [{data}, connect] = useConnect()

  const signIn = async () => {
    connect(data.connectors[0])
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
