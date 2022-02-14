import {Text} from '@chakra-ui/layout'
import {useToast} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {useEffect} from 'react'
import {RLink} from 'src/components/links'
import {useUser} from 'src/layouts/UserContext'
import {save as saveIntendedConnection} from 'src/lib/intendedConnectionStorage'
import {track} from 'src/lib/posthog'
import {useGuard} from 'src/lib/useGuard'
import {requireNoExistingProfile} from '../../../lib/guards'
import RegisterScreen from '../RegisterScreen'

const IntroPage: React.FC<{
  purposeIdentifier?: string
  externalAddress?: string
}> = ({purposeIdentifier, externalAddress}) => {
  const {registrationAttempt} = useUser()

  requireNoExistingProfile()
  useGuard(!registrationAttempt, routes.registerSubmitted())

  useEffect(() => {
    if (purposeIdentifier && externalAddress) {
      saveIntendedConnection({purposeIdentifier, externalAddress})
    }
  }, [])

  const toast = useToast()
  const alreadyRegistered = () => {
    track('already registered clicked')
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
        href: routes.registerHowItWorks(),
      }}
      secondaryButtonLabel="I'm already registered"
      secondaryButtonProps={{onClick: alreadyRegistered}}
    />
  )
}

export default IntroPage
