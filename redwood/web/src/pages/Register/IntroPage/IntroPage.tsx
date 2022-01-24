import {Heading, Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useContext, useEffect} from 'react'
import {RLink} from 'src/components/links'
import UserContext from 'src/layouts/UserContext'
import {save as saveIntendedConnection} from 'src/lib/intendedConnectionStorage'
import {useNav} from 'src/lib/util'
import RegisterLogo from '../RegisterLogo'

const IntroPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = ({purposeIdentifier, externalAddress}) => {
  const {cachedProfile, unsubmittedProfile} = useContext(UserContext)

  if (cachedProfile != null)
    return useNav(routes.profile({id: cachedProfile.id}))

  if (unsubmittedProfile != null)
    return useNav(routes.registerSubmitted(), {replace: true})

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
    <Stack spacing="6" flex="1">
      <MetaTags title="Register" />
      <RegisterLogo />
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
      <Spacer />
      <Button
        variant="register-primary"
        as={RLink}
        href={routes.registerConnectWallet()}
      >
        Let's go!
      </Button>
      <Button variant="register-secondary" onClick={alreadyRegistered}>
        I'm already registered
      </Button>
    </Stack>
  )
}

export default IntroPage
