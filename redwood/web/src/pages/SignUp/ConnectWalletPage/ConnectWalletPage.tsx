import {Spacer, Text, VStack} from '@chakra-ui/layout'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext, useEffect, useState} from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import UserContext from 'src/layouts/UserContext'
import SignUpLogo from '../SignUpLogo'

const ConnectWalletPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = () => {
  const {ethereumAddress, isFreshAddress} = useContext(UserContext)

  useEffect(() => {
    getAddressTransactions(ethereumAddress)
  }, [ethereumAddress])

  const getAddressTransactions = (ethereumAddress: string) => {
    gql`
      query fetchAddressTransactions($ethereumAddress: ID!) {
        addressInfo: fetchAddressTransactions(ethereumAddress: $ethereumAddress) {
          transactionCount
          isFreshAddress
        }
      }
    `
  }

  if (ethereumAddress != null)
    return <Redirect to={routes.signUpAllowCamera()} />

  return (
    <VStack spacing="6" flex="1">
      <SignUpLogo />
      <MetaTags title="Sign Up" />
      <Spacer display={['initial', 'none']} />
      <Text>
        To protect your privacy, connect an Ethereum wallet and{' '}
        <strong>create a new address</strong>.
      </Text>
      <ConnectButton colorScheme="purple" my="8">
        Connect wallet
      </ConnectButton>
    </VStack>
  )
}

export default ConnectWalletPage
