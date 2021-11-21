import { Box, Heading, Link, Stack, Text } from '@chakra-ui/layout'
import { MetaTags } from '@redwoodjs/web'

import { Contract, Abi, stark, defaultProvider } from 'starknet'

import NYM_ABI from '../../../../../starknet/starknet-artifacts/contracts/nym.cairo/nym_abi.json'
import NYM_ADDRESS from '../../../../../starknet/deployments/goerli/nym.json'

import ERC20_ABI from '../../../../../starknet/starknet-artifacts/contracts/ERC20.cairo/ERC20_abi.json'
import ERC20_ADDRESS from '../../../../../starknet/deployments/goerli/erc20.json'

import SIMPLE_ACCOUNT_ABI from '../../../../../starknet/starknet-artifacts/contracts/simple_account.cairo/simple_account_abi.json'
import NOTARY_ADDRESS from '../../../../../starknet/deployments/goerli/notary.json'
import { Card } from 'src/components/Card'
import { Input } from '@chakra-ui/input'
import { Button } from '@chakra-ui/button'
import React from 'react'
import { getProfile } from 'src/lib/starknet'

/*
export interface StarknetState {
  account?: string;
  connectBrowserWallet: () => void;
  library: ProviderInterface;
}

export const STARKNET_STATE_INITIAL_STATE: StarknetState = {
  account: undefined,
  connectBrowserWallet: () => undefined,
  library: defaultProvider,
};
*/

const getNumProfiles = async () => {
  const nym = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)
  const response = await nym.call('get_num_profiles', {})
  console.log('Response', response)
}

const submitProfile = async () => {
  const notary = new Contract(
    SIMPLE_ACCOUNT_ABI as Abi[],
    NOTARY_ADDRESS.address
  )

  //const { r, s } = ec.sign(starkKeyPair, msgHash);

  /*
  const approval = await notary.invoke('execute', {
    to: ERC20_ADDRESS.address,
    selector: stark.getSelectorFromName('approve'),
    calldata: [NYM_ADDRESS.address, '50', '0'],
  })

  console.log('approval', approval)

  console.log('Approval transaction hash', approval.transaction_hash)
  await defaultProvider.waitForTx(approval.transaction_hash)
  console.log('done waiting for tx')
  */

  console.log({ calldata })
  const submission = await notary.invoke('execute', {
    to: NYM_ADDRESS.address,
    selector: stark.getSelectorFromName('submit'),
    calldata: ['1234000', '5678000'],
  })
  console.log('Submission transaction hash', submission.transaction_hash)
  await defaultProvider.waitForTx(submission.transaction_hash)
  console.log('done waiting for tx')

  //const contract = new Contract(NYM_ABI as Abi[], NYM_ADDRESS.address)
  //const response = await contract.invoke('get_num_profiles', {})
  //console.log('Response', response)
}

const GetProfile = () => {
  const profileId = React.useRef()
  const output = React.useState<string | null>()
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    try {
      console.log(profileId.current.value)
      const profile = await getProfile('0x1')
      console.log(profile)
    } finally {
      setRunning(false)
    }
    // defaultProvider.
  }

  return (
    <Card>
      <Stack spacing={4}>
        <Heading as="h2">get_profile</Heading>
        <Input ref={profileId} placeholder="Profile ID" defaultValue="1" />
        <Button onClick={run} isLoading={running} colorScheme="blue">
          Run
        </Button>
      </Stack>
    </Card>
  )
}

const TestTransactionPage = () => {
  //const { account } = useEthers()
  //if (account != null) return <Redirect to={routes.createProfile()} />
  // useStarknetCall

  return (
    <Box maxW="xl" mx="auto">
      <MetaTags title="Test Transaction" />
      <Heading size="lg" pb="4">
        Test Transaction
      </Heading>
      <Text>
        Contract Address:{' '}
        <Link
          isExternal
          href={`https://voyager.online/contract/${NYM_ADDRESS.address}`}
        >
          {NYM_ADDRESS.address}
        </Link>
      </Text>
      <Button onClick={submitProfile}>
        <Text>Submit profile</Text>
      </Button>
      <Button onClick={getNumProfiles} colorScheme="blue">
        <Text>Get number of profiles</Text>
      </Button>
      <GetProfile />
    </Box>
  )
}

export default TestTransactionPage
