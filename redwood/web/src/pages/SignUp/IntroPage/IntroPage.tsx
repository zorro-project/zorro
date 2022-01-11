import {Heading, Spacer, Text, VStack} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext, useEffect} from 'react'
import {RLink} from 'src/components/links'
import UserContext from 'src/layouts/UserContext'
import {save as saveIntendedConnection} from 'src/lib/intendedConnectionStorage'
import SignUpLogo from '../SignUpLogo'

const IntroPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = ({purposeIdentifier, externalAddress}) => {
  const {ethereumAddress} = useContext(UserContext)
  console.log('blah blah')

  useEffect(() => {
    if (purposeIdentifier && externalAddress) {
      saveIntendedConnection({purposeIdentifier, externalAddress})
    }
  }, [])

  const toast = useToast()
  const alreadyRegistered = () => {
    toast({
      title:
        'Please connect the wallet you registered with previously to continue.',
      status: 'info',
      isClosable: true,
      duration: 15000,
    })
  }

  if (ethereumAddress != null) return <Redirect to={routes.signUpEdit()} />

  return (
    <VStack maxW="md" mx="auto" spacing="6">
      <SignUpLogo />
      <MetaTags title="Connect Wallet" />
      <Heading size="lg" pb="4" alignSelf="flex-start">
        Zorro: web3 citizenship
      </Heading>
      <Text>
        Becoming a web3 citizen will let you claim additional voting rights and
        other privileges.
      </Text>
      <Text>
        It takes about 8 minutes. The costs are covered by the Zorro community.
      </Text>
      <Spacer display={['initial', 'none']} />
      <Button
        as={RLink}
        href={routes.signUpConnectWallet()}
        colorScheme="purple"
      >
        Let's go!
      </Button>
      <Button variant="link" colorScheme="purple" onClick={alreadyRegistered}>
        I'm already registered
      </Button>
    </VStack>
  )
}

export default IntroPage
