import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'
import { Box, Heading, Link, Stack, Text } from '@chakra-ui/layout'
import { MetaTags } from '@redwoodjs/web'
import { Card } from 'src/components/Card'
import getNotaryKey from 'src/lib/getNotaryKey'
import { cairoCompatibleAdd } from 'src/lib/ipfs'
import NYM_ADDRESS from '../../../../../starknet/deployments/goerli/nym.json'
import {
  exportProfileById,
  getNumProfiles,
  notarySubmitProfile,
} from '../../../../api/src/lib/starknet'
import { serializeCid } from '../../../../api/src/lib/serializers'

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

const submitTestProfile = async () => {
  // window.bytesToFelt = bytesToFelt
  // window.feltToBytes = feltToBytes
  // window.parseCid = parseCid
  // window.CID = CID

  const cid = await cairoCompatibleAdd(
    JSON.stringify({
      photo: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
      video: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
    })
  )
  const addr = '0x334230242D318b5CA159fc38E07dC1248B7b35e4'
  console.log('cid', cid, serializeCid(cid))

  await notarySubmitProfile(serializeCid(cid), addr, getNotaryKey())
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
      <Button onClick={submitTestProfile}>
        <Text>Submit test profile</Text>
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
