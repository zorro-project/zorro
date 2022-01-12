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
  const {cachedProfile} = useContext(UserContext)

  if (cachedProfile != null)
    return <Redirect to={routes.profile({id: cachedProfile.id})} />

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

  return (
    <VStack spacing="6" flex="1">
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
