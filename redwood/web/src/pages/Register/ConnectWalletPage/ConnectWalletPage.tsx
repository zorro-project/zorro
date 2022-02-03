import {useState} from 'react'
import {Link, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import ConnectButton, {
  reconnect,
} from 'src/components/ConnectButton/ConnectButton'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import RegisterScreen from '../RegisterScreen'
import useAsyncEffect from 'use-async-effect'

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  UseDisclosureReturn,
  Input,
  Button,
} from '@chakra-ui/react'
import {ExternalLinkIcon} from '@chakra-ui/icons'
import {appNav} from 'src/lib/util'

const ReusingAccountsIsScary = (props: {ctrl: UseDisclosureReturn}) => {
  const {ethereumAddress} = useUser()
  const [confirmedAddress, setConfirmedAddress] = useState('')
  const confirmationMatches =
    confirmedAddress.toLowerCase() === ethereumAddress.toLowerCase()

  return (
    <Modal onClose={props.ctrl.onClose} isOpen={props.ctrl.isOpen} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Trying to use an existing address?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            <Text>
              We detected previous activity on your connected address,{' '}
              {ethereumAddress}. You can see that activity{' '}
              <Link
                isExternal
                href={`https://etherscan.io/address/${ethereumAddress}`}
                display="inline-flex"
                alignItems="center"
              >
                here
                <ExternalLinkIcon ml={1} />
              </Link>
              .
            </Text>
            <Text>
              Since the Zorro profile registry must be public to ensure
              transparency, signing up for Zorro with your existing address will
              associate your face and voice with all your previous transactions.
              This could be a major privacy risk.
            </Text>
            <Text>
              If you're sure you know what you're doing and are ok irreversibly
              linking your face and voice with your transaction history, copy
              your Ethereum address into the box below and click "I understand".
            </Text>
            <Input
              placeholder="Ethereum address"
              value={confirmedAddress}
              onChange={(e) => setConfirmedAddress(e.target.value)}
            />
            <Button
              colorScheme="red"
              size="md"
              alignSelf="center"
              disabled={!confirmationMatches}
              onClick={() => appNav(routes.registerAllowCamera())}
            >
              I understand
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const AddressAlert = (props: {mockModalOpen: boolean}) => {
  const modalCtrl = useDisclosure({defaultIsOpen: props.mockModalOpen})

  return (
    <Alert
      status="info"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Reconnect with a fresh address
      </AlertTitle>
      <AlertDescription maxWidth="sm">
        <Text>
          Creating a fresh address protects your privacy. When Metamask pops up,
          click 'New Account'.
        </Text>
        <Text>
          <Link onClick={modalCtrl.onOpen}>Learn about reusing addresses.</Link>
        </Text>
      </AlertDescription>
      <ReusingAccountsIsScary ctrl={modalCtrl} />
    </Alert>
  )
}

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
  mockIsFresh?: undefined | false
  mockModalOpen?: boolean
}> = ({mockIsFresh = undefined, mockModalOpen = false}) => {
  const {ethereumAddress, registrationAttempt} = useUser()
  const [isCheckingFreshness, setIsCheckingFreshness] = useState(false)
  const [isFresh, setIsFresh] = useState<boolean | undefined>(mockIsFresh)

  useGuard(!registrationAttempt, routes.registerSubmitted())
  useGuard(!(isFresh === true), routes.registerAllowCamera())

  // could use https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
  useAsyncEffect(
    async (isActive) => {
      if (!ethereumAddress) return
      setIsCheckingFreshness(true)
      const response = await fetch(
        `${
          global.RWJS_API_URL as string
        }/getEthereumAddressUsage?address=${ethereumAddress}`
      )
      const result = await response.json()
      if (!isActive()) return
      setIsCheckingFreshness(false)
      setIsFresh(result.isFresh)
    },
    [ethereumAddress]
  )

  if (ethereumAddress && isFresh === false) {
    return (
      <RegisterScreen
        shouldHideTitle
        title="Use a fresh address"
        buttonDescription={<AddressAlert mockModalOpen={mockModalOpen} />}
        PrimaryButtonComponent={!ethereumAddress ? ConnectButton : undefined}
        primaryButtonLabel="Reconnect wallet"
        primaryButtonProps={{onClick: reconnect}}
      />
    )
  }

  return (
    <RegisterScreen
      shouldHideTitle
      title="Connect wallet"
      buttonDescription={
        !isCheckingFreshness && (
          <Text>
            To protect your privacy, connect an Ethereum wallet and{' '}
            <strong>create a new address</strong>.
          </Text>
        )
      }
      PrimaryButtonComponent={!ethereumAddress ? ConnectButton : undefined}
      primaryButtonLabel="Connect wallet"
      primaryButtonProps={{isLoading: isCheckingFreshness}}
    />
  )
}

export default ConnectWalletPage
