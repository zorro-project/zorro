import {Link, Spacer, Stack} from '@chakra-ui/layout'
import {Button, Text} from '@chakra-ui/react'
import {back} from '@redwoodjs/router'
import React from 'react'
import {ZorroAddress} from 'src/lib/api'
import RegisterScreen, {TextContainer} from '../RegisterScreen'

const SelfSubmitPage = () => {
  return (
    <RegisterScreen
      title="Submitting your own profile"
      secondaryButtonLabel="Go back"
      secondaryButtonProps={{onClick: back}}
    >
      <TextContainer pt="8">
        <Text>
          If the Zorro notary service is down, or is taking too long to review
          and approve your profile, or wrongly denies it, you have the option to{' '}
          <strong>self submit</strong>.
        </Text>
        <Text>
          This allows you to submit your profile directly and permissionlessly
          to the Zorro smart contract hosted on StarkNet.
        </Text>
        <Text>
          Self-submitting is more expensive than submitting through the Zorro
          notary service, because you'll be required to pay your own transaction
          fees and security deposit (the security deposit is forfeited if your
          profile does not meet the registry requirements and is successfully
          challenged). It is also slower, since there's a 3-day mandatory
          challenge period before your profile becomes live.
        </Text>
        <Text>
          The easiest way to self-submit is to use the{' '}
          <Link isExternal href="https://voyager.online/">
            Voyager block explorer
          </Link>
          . You can find the Zorro smart contract{' '}
          <Link
            isExternal
            href={`https://goerli.voyager.online/contract/${ZorroAddress}`}
          >
            here
          </Link>
          . The method you'll want to call is <code>submit</code>, and you can
          find more details about the correct formatting of the parameters{' '}
          <Link
            isExternal
            href="https://github.com//zorro-project/zorro/blob/main/redwood/api/src/chain/starknet.ts"
          >
            in our code
          </Link>
          .
        </Text>
      </TextContainer>
    </RegisterScreen>
  )
  return (
    <Stack spacing="6" flex="1">
      <Spacer />
      <Button variant="register-secondary" onClick={back}>
        Go Back
      </Button>
    </Stack>
  )
}

export default SelfSubmitPage
