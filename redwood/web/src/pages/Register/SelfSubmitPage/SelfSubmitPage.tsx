import {Link, Spacer, Stack} from '@chakra-ui/layout'
import {Button, Text} from '@chakra-ui/react'
import {back} from '@redwoodjs/router'
import React from 'react'
import {ZorroAddress} from '../../../../../api/src/lib/starknet'
import Title from '../Title'

const SelfSubmitPage = () => {
  return (
    <Stack spacing="6" flex="1">
      <Title title="Submitting your own profile" />
      <Text>
        If the Zorro community notary is down, or is taking too long to review
        and approve your profile, you have the option to{' '}
        <strong>self submit</strong>.
      </Text>
      <Text>
        This allows you to submit your profile directly and permissionlessly to
        the Zorro smart contract hosted on StarkNet.
      </Text>
      <Text>
        Self-submitting is more expensive than submitting through the Zorro
        community notary, because you'll be required to pay your own transaction
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
          href="https://github.com//zorro-project/zorro/blob/main/redwood/api/src/lib/starknet.ts"
        >
          in our code
        </Link>
        .
      </Text>
      <Spacer />
      <Button variant="register-secondary" onClick={back}>
        Go Back
      </Button>
    </Stack>
  )
}

export default SelfSubmitPage
