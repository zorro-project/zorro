import {
  Alert,
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
  UseDisclosureReturn,
} from '@chakra-ui/react'
import {track} from 'src/lib/posthog'
import {Connector, useConnect} from 'wagmi'
import connectors from './connectors'

const SelectConnectorButton: React.FC<
  {
    connector: Connector
    onConnect: (connector: Connector) => void
  } & ButtonProps
> = (props) => {
  const {onConnect, connector, ...rest} = props

  return (
    <Button onClick={() => onConnect(connector)} {...rest}>
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
  const onConnect = async (connector: Connector) => {
    const resp = await connect[1](connector)
    if (resp?.data) {
      control.onClose()
      track('connected successfully')
      onSuccess?.()
    }
  }

  return (
    <Modal
      isOpen={control.isOpen}
      onClose={control.onClose}
      isCentered
      size="md"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={4} fontSize="lg" fontWeight="medium">
          Connect wallet
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            {connectors.injected.ready ? (
              <SelectConnectorButton
                connector={connectors.injected}
                onConnect={onConnect}
                disabled={connect[0].loading}
              />
            ) : (
              <Button as={Link} isExternal href="https://metamask.io/download/">
                Install Metamask
              </Button>
            )}
            <SelectConnectorButton
              connector={connectors.walletConnect}
              onConnect={onConnect}
              disabled={connect[0].loading}
            />
            <SelectConnectorButton
              connector={connectors.walletLink}
              onConnect={onConnect}
              disabled={connect[0].loading}
            />
            {connect[0].error && (
              <Alert status="error">
                {connect[0].error?.message ?? 'Failed to connect'}
              </Alert>
            )}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
