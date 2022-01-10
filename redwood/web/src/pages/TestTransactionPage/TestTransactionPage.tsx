import {getStarknet} from '@argent/get-starknet'
import {Button} from '@chakra-ui/button'
import {Input} from '@chakra-ui/input'
import {Box, Heading, Link, Stack, Text} from '@chakra-ui/layout'
import {FormControl, FormLabel} from '@chakra-ui/react'
import {MetaTags} from '@redwoodjs/web'
import {Card} from 'src/components/Card'
import getNotaryKey from 'src/lib/getNotaryKey'
import {cairoCompatibleAdd} from 'src/lib/ipfs'
import {serializeCid} from '../../../../api/src/lib/serializers'
import {
  ERC20Address,
  erc20Mint,
  exportProfileById,
  erc20GetAllowance,
  erc20GetBalanceOf,
  getNumProfiles,
  NotaryAddress,
  notarySubmitProfile,
  ZorroAddress,
} from '../../../../api/src/lib/starknet'

const ExportProfileById = () => {
  const profileId = React.useRef<HTMLInputElement>()
  const [output, setOutput] = React.useState<object | null>()
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const profile = await exportProfileById(
        parseInt(profileId.current?.value ?? '1', 10)
      )
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

const ERC20Ops = (props: {userWallet: string | null}) => {
  const [output, setOutput] = React.useState<string | null>()
  const [running, setRunning] = React.useState(false)

  const owner = React.useRef<HTMLInputElement>()
  const spender = React.useRef<HTMLInputElement>()

  const runGetAllowance = async () => {
    setRunning(true)
    try {
      setOutput(
        (
          'allowance: ' +
          (await erc20GetAllowance(owner.current.value, spender.current.value))
        ).toString()
      )
    } finally {
      setRunning(false)
    }
  }

  const runBalanceOf = async () => {
    setRunning(true)
    try {
      setOutput(
        (
          'balance_of: ' + (await erc20GetBalanceOf(owner.current.value))
        ).toString()
      )
    } finally {
      setRunning(false)
    }
  }

  const runMint = async () => {
    setRunning(true)
    const starknet = getStarknet({showModal: true})

    try {
      await erc20Mint(starknet.signer, owner.current.value, 500)
      await runBalanceOf()
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <Stack spacing={4}>
        <Heading as="h2">ERC20</Heading>
        <FormControl>
          <FormLabel>Owner</FormLabel>
          <Input
            ref={owner}
            placeholder="Owner"
            defaultValue={props.userWallet || NotaryAddress}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Spender</FormLabel>
          <Input
            ref={spender}
            placeholder="Owner"
            defaultValue={ZorroAddress}
          />
        </FormControl>

        <Button
          onClick={runGetAllowance}
          isLoading={running}
          colorScheme="blue"
        >
          allowance(owner, spender)
        </Button>

        <Button onClick={runBalanceOf} isLoading={running} colorScheme="blue">
          balance_of(owner)
        </Button>

        <Button onClick={runMint} isLoading={running} colorScheme="blue">
          mint(owner, 500)
        </Button>
        {<pre>{output}</pre>}
      </Stack>
    </Card>
  )
}

const ContractLink: React.FC<{name: string; address: string}> = ({
  name,
  address,
}) => (
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
  const starknet = getStarknet({showModal: true})

  const [userWallet, setUserWallet] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function getUserWallet() {
      const [userWalletContractAddress] = await starknet.enable()
      setUserWallet(userWalletContractAddress)
    }
    getUserWallet()
  }, [])

  return (
    <Box maxW="xl" mx="auto">
      <MetaTags title="Test Transactions" />
      <Heading size="lg" pb="4">
        Test Transactions
      </Heading>
      <ContractLink name="Zorro" address={ZorroAddress} />
      <ContractLink name="Notary" address={NotaryAddress} />
      <ContractLink name="ERC20" address={ERC20Address} />
      {userWallet && <ContractLink name="My Wallet" address={userWallet} />}
      <Stack spacing={4}>
        <GetNumProfiles />
        <ExportProfileById />
        <ERC20Ops userWallet={userWallet} />
        <Button onClick={submitTestProfile}>
          <Text>Submit test profile</Text>
        </Button>
      </Stack>
    </Box>
  )
}

export default TestTransactionPage
