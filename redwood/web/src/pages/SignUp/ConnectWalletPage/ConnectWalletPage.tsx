import {useLazyQuery} from '@apollo/client'
import {Spacer, Text, VStack} from '@chakra-ui/layout'
import {Alert, AlertIcon, AlertTitle} from '@chakra-ui/react'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext, useEffect} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import UserContext from 'src/layouts/UserContext'
import { fetchAddressTransactions, fetchAddressTransactionsVariables } from 'types/graphql'
import SignUpLogo from '../SignUpLogo'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress} = useContext(UserContext)

  useEffect(() => {
    if (ethereumAddress) queryAddressTransactions({variables: {ethereumAddress}})
  }, [ethereumAddress])

  const [queryAddressTransactions, {data}] = useLazyQuery<fetchAddressTransactions, fetchAddressTransactionsVariables>(
    gql`
      query fetchAddressTransactions($ethereumAddress: ID!) {
        addressInfo: fetchAddressTransactions(ethereumAddress: $ethereumAddress) {
          transactionCount
          isFreshAddress
        }
      }
    `
  )

  if (ethereumAddress && data?.addressInfo?.isFreshAddress)
    return <Redirect to={routes.signUpAllowCamera()} />

  return (
    <VStack spacing="6" flex="1">
      <SignUpLogo />
      <MetaTags title="Sign Up" />
      <Spacer display={['initial', 'none']} />
      {data?.addressInfo?.isFreshAddress === false ?
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Your address has been used before. Please disconnect your address and connect a <strong>fresh, new address</strong>.</AlertTitle>
        </Alert>
        :
        <>
          <Text>
            To protect your privacy, connect an Ethereum wallet and{' '}
            <strong>create a new address</strong>.
          </Text>
          <ConnectButton colorScheme="purple" my="8">
            Connect wallet
          </ConnectButton>
        </>
      }
    </VStack>
  )
}

export default ConnectWalletPage
