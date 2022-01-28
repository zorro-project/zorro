import {Heading, Spacer, Stack, Text} from '@chakra-ui/layout'
import {Button, useToast} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import {useEffect} from 'react'
import {RLink} from 'src/components/links'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import {save as saveIntendedConnection} from 'src/lib/intendedConnectionStorage'
import {requireNoExistingProfile} from '../guards'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'
import RegisterScreen from '../RegisterScreen'

const IntroPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = ({purposeIdentifier, externalAddress}) => {
  const {unsubmittedProfile} = useUser()

  requireNoExistingProfile()
  useGuard(!unsubmittedProfile, routes.registerSubmitted())

  useEffect(() => {
    if (purposeIdentifier && externalAddress) {
      saveIntendedConnection({purposeIdentifier, externalAddress})
    }
  }, [])

  const toast = useToast()
  const alreadyRegistered = () => {
    toast({
      title:
        'Please connect the wallet account that you previously registered with.',
      status: 'info',
      isClosable: true,
      duration: 15000,
    })
  }

  return (
    <RegisterScreen
      shouldShowLogo
      title="Zorro: web3 citizenship"
      description={
        <>
          <Text>
            Becoming a Zorro citizen will let you claim additional voting rights
            and other privileges.
          </Text>
          <Text>
            It takes about five minutes. The costs are covered by the Zorro
            community.
          </Text>
        </>
      }
      primaryButtonLabel="Let's go!"
      primaryButtonProps={{
        as: RLink,
        href: routes.registerConnectWallet(),
      }}
      secondaryButtonLabel="I'm already registered"
      secondaryButtonProps={{onClick: alreadyRegistered}}
    />
  )
}

export default IntroPage
