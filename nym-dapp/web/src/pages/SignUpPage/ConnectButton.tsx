import { Button, Box, Text, useDisclosure } from '@chakra-ui/react'
import { useEthers } from '@usedapp/core'
import Identicon from './Identicon'
import AccountModal from './AccountModal'

// Adapted from https://dev.to/jacobedawson/build-a-web3-dapp-in-react-login-with-metamask-4chp

export default function ConnectButton() {
  const { activateBrowserWallet, account } = useEthers()
  const { isOpen, onOpen, onClose } = useDisclosure()

  return account ? (
    <>
      <AccountModal isOpen={isOpen} onClose={onClose} />
      <Button onClick={() => onOpen()} m="1px" px={3}>
        <Text mr="2">
          {account &&
            `${account.slice(0, 8)}...${account.slice(
              account.length - 8,
              account.length
            )}`}
        </Text>
        <Identicon />
      </Button>
    </>
  ) : (
    <Button onClick={() => activateBrowserWallet()}>Connect to a wallet</Button>
  )
}
