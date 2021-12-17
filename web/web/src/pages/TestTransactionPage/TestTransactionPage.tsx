import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'
import { Box, Heading, Link, Stack, Text } from '@chakra-ui/layout'
import { MetaTags } from '@redwoodjs/web'
import { Card } from 'src/components/Card'
import getNotaryKey from 'src/lib/getNotaryKey'
import { cairoCompatibleAdd } from 'src/lib/ipfs'
import { serializeCid } from '../../../../api/src/lib/serializers'
import {
  ERC20Address,
  exportProfileById,
  getAllowance,
  getNumProfiles,
  NotaryAddress,
  notarySubmitProfile,
  ZorroAddress,
} from '../../../../api/src/lib/starknet'

const ExportProfileById = () => {
  const profileId = React.useRef()
  const [output, setOutput] = React.useState<object | null>()
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const profile = await exportProfileById(profileId?.current?.value || '1')
      setOutput(profile)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <Stack spacing={4}>
        <Heading as="h2">export_profile_by_id</Heading>
        <Input ref={profileId} placeholder="Profile ID" defaultValue="1" />
        <Button onClick={run} isLoading={running} colorScheme="blue">
          Run
        </Button>
        {output && <pre>{JSON.stringify(output, null, 2)}</pre>}
      </Stack>
    </Card>
  )
}

const GetNumProfiles = () => {
  const [output, setOutput] = React.useState<number | null>()
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    try {
      setOutput(await getNumProfiles())
    } finally {
      setRunning(false)
    }
  }

  React.useEffect(() => {
    run()
  }, [])

  return (
    <Card>
      <Stack spacing={4}>
        <Heading as="h2">get_num_profiles</Heading>
        <Button onClick={run} isLoading={running} colorScheme="blue">
          Run
        </Button>
        {output != null && <pre>Number of profiles: {output}</pre>}
      </Stack>
    </Card>
  )
}

const GetNotaryZorroAllowance = () => {
  const [output, setOutput] = React.useState<number | null>()
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    try {
      await getAllowance(NotaryAddress, ZorroAddress)
      setOutput((await getAllowance(NotaryAddress, ZorroAddress)).toString())
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <Stack spacing={4}>
        <Heading as="h2">erc20.allowance(notary, zorro)</Heading>
        <Button onClick={run} isLoading={running} colorScheme="blue">
          Run
        </Button>
        {output != null && <pre>Allowance: {output}</pre>}
      </Stack>
    </Card>
  )
}

const ContractLink = ({ name, address }) => (
  <Text>
    {name} Contract:{' '}
    <Link isExternal href={`https://goerli.voyager.online/contract/${address}`}>
      {address}
    </Link>
  </Text>
)

const submitTestProfile = async () => {
  const cid = await cairoCompatibleAdd(
    JSON.stringify({
      photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
      video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
    })
  )
  const addr = '0x334230242D318b5CA159fc38E07dC1248B7b35e4'

  await notarySubmitProfile(serializeCid(cid), addr, getNotaryKey())
}

const TestTransactionPage = () => {
  return (
    <Box maxW="xl" mx="auto">
      <MetaTags title="Test Transactions" />
      <Heading size="lg" pb="4">
        Test Transactions
      </Heading>
      <ContractLink name="Zorro" address={ZorroAddress} />
      <ContractLink name="Notary" address={NotaryAddress} />
      <ContractLink name="ERC20" address={ERC20Address} />
      <Stack spacing={4}>
        <GetNumProfiles />
        <ExportProfileById />
        <GetNotaryZorroAllowance />
        <Button onClick={submitTestProfile}>
          <Text>Submit test profile</Text>
        </Button>
      </Stack>
    </Box>
  )
}

export default TestTransactionPage
