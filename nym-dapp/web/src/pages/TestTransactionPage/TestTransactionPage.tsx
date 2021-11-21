import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'
import { Box, Heading, Link, Stack, Text } from '@chakra-ui/layout'
import { MetaTags } from '@redwoodjs/web'
import { Card } from 'src/components/Card'
import NYM_ADDRESS from '../../../../../starknet/deployments/goerli/nym.json'
import {
  exportProfileById,
  getNumProfiles,
  notarySubmitProfile,
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

const TestTransactionPage = () => {
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
      <Button onClick={() => notarySubmitProfile('1234', '5678')}>
        <Text>Submit profile</Text>
      </Button>
      <Button
        onClick={async () => console.log(await getNumProfiles())}
        colorScheme="blue"
      >
        <Text>Get number of profiles</Text>
      </Button>
      <ExportProfileById />
    </Box>
  )
}

export default TestTransactionPage
