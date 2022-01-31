import {useState} from 'react'
import {Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import ConnectButton, {
  reconnect,
} from 'src/components/ConnectButton/ConnectButton'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import RegisterScreen from '../RegisterScreen'
import useAsyncEffect from 'use-async-effect'

import {Alert, AlertIcon, AlertTitle, AlertDescription} from '@chakra-ui/react'

const AddressAlert = () => (
  <Alert
    status="info"
    variant="subtle"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    height="200px"
  >
    <AlertIcon boxSize="40px" mr={0} />
    <AlertTitle mt={4} mb={1} fontSize="lg">
      Please make a fresh address
    </AlertTitle>
    <AlertDescription maxWidth="sm">
      Creating a fresh address protects your privacy. When Metamask pops up,
      click 'New Account'
    </AlertDescription>
  </Alert>
)

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress, registrationAttempt} = useUser()
  //const [hadEthereumAddressOnLoad] = useState(!!ethereumAddress)
  const [isCheckingFreshness, setIsCheckingFreshness] = useState(false)
  const [isFresh, setIsFresh] = useState()

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
        buttonDescription={<AddressAlert />}
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
