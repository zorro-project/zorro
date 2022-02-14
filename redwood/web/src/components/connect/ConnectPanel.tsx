import {
  Alert,
  Button,
  ButtonProps,
  Icon,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  UseDisclosureReturn,
  Spinner,
  Box,
} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {Connector, useConnect} from 'wagmi'
import connectors from './connectors'

//import CoinbaseWalletSvg from './icons/coinbaseWallet.svg'
import MetamaskSvg from './icons/metamask.svg'
import WalletConnectSvg from './icons/walletConnect.svg'

const SelectConnectorButton: React.FC<
  {
    connector: Connector
    onConnect: (connector: Connector) => void
  } & ButtonProps
> = (props) => {
  const {onConnect, connector, ...rest} = props

  return (
    <Button
      onClick={() => onConnect(connector)}
      justifyContent="space-between"
      leftIcon={<Box />}
      rightIcon={<Box />}
      {...rest}
    >
      {connector.name}
    </Button>
  )
}

export default function ConnectPanel({
  control,
  connect,
  onSuccess,
}: {
  control: UseDisclosureReturn
  connect: ReturnType<typeof useConnect>
  onSuccess?: () => void
}) {
  const [authError, setAuthError] = useState<string | undefined>()
  const [selectedWallet, setSelectedWallet] = useState<
    keyof typeof connectors | null
  >(null)

  const onConnect = async (connector: Connector) => {
    setAuthError(undefined)
    const resp = await connect[1](connector)
    if (resp?.data) {
      control.onClose()
      onSuccess?.()
    }
    if (resp?.error) {
      console.log('Error connecting wallet:', resp?.error)
      setAuthError(
        // @ts-ignore
        resp?.error?.code === -32002
          ? "There's already a pending connect wallet request"
          : resp?.error?.message ?? 'Failed to connect'
      )
    }
  }

  useEffect(() => {
    if (!control.isOpen) setAuthError(undefined)
  }, [control.isOpen])

  const isInjectedWalletSelected = selectedWallet === 'injected'
  const isLoading = connect[0].loading
  const isInjectedWalletConnecting = isLoading && isInjectedWalletSelected
  return (
    <Modal
      isOpen={control.isOpen}
      onClose={control.onClose}
      isCentered
      size="sm"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Connect a wallet
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            {connectors.injected.ready ? (
              <SelectConnectorButton
                connector={connectors.injected}
                onConnect={(...args) => {
                  setSelectedWallet('injected')
                  onConnect(...args)
                }}
                disabled={isInjectedWalletConnecting}
                rightIcon={
                  isInjectedWalletConnecting ? (
                    <Spinner />
                  ) : (
                    <Icon as={MetamaskSvg} />
                  )
                }
              />
            ) : (
              <Button
                as={Link}
                isExternal
                href="https://metamask.io/download/"
                leftIcon={<Box />}
                justifyContent="space-between"
                rightIcon={<Icon as={MetamaskSvg} />}
              >
                Install Metamask
              </Button>
            )}
            <SelectConnectorButton
              connector={connectors.walletConnect}
              onConnect={(...args) => {
                setSelectedWallet('walletConnect')
                onConnect(...args)
              }}
              disabled={isInjectedWalletConnecting}
              rightIcon={<Icon as={WalletConnectSvg} />}
            />
            {/*<SelectConnectorButton
              connector={connectors.walletLink}
              onConnect={() => {
                setSelectedWallet('walletConnect')
                onConnect()
              }}
              disabled={isLoading}
              rightIcon={
                isLoading ? <Spinner /> : <Icon as={CoinbaseWalletSvg} />
              }
            />*/}
            {authError && (
              <Alert mt={4} status="error">
                {authError}
              </Alert>
            )}
            {isInjectedWalletConnecting && (
              <Alert mt={4} status="info">
                Please follow the prompt in your wallet software
              </Alert>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
