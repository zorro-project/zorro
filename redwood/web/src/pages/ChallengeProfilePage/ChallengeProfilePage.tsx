import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  ListItem,
  OrderedList,
  Stack,
  Textarea,
  Text,
  Link,
  FormErrorMessage,
} from '@chakra-ui/react'
import {Form, useForm} from '@redwoodjs/forms'
import {Redirect, routes} from '@redwoodjs/router'
import {CellSuccessProps, createCell, MetaTags} from '@redwoodjs/web'
import {ReactElement} from 'react'
import ResizeTextarea from 'react-textarea-autosize'
import {Card} from 'src/components/Card'
import {InternalLink, RLink} from 'src/components/links'
import {cairoCompatibleAdd} from 'src/lib/ipfs'
import {
  ChallengePageQuery,
  ChallengePageQueryVariables,
  StatusEnum,
} from 'types/graphql'
import {
  erc20Approve,
  erc20GetBalanceOf,
  getChallengeDepositSize,
  submitChallenge,
  ZorroAddress,
} from '../../../../api/src/lib/starknet'

import {getStarknet} from '@argent/get-starknet'
import {useLazyQuery} from '@apollo/client'
import {serializeCid} from '../../../../api/src/lib/serializers'
import {toast} from '@redwoodjs/web/dist/toast'

const QUERY = gql`
  query ChallengePageQuery($id: ID!, $resync: Boolean) {
    cachedProfile(id: $id, resync: $resync) {
      id
      ethereumAddress
      currentStatus
    }

    contractCache {
      challengeDepositSize
      challengeRewardSize
    }
  }
`

const NotChallenged = (props: {query: ChallengePageQuery}) => {
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(
    null
  )
  const profile = props.query.cachedProfile
  const contractCache = props.query.contractCache

  const [refetchProfile] = useLazyQuery<
    ChallengePageQuery,
    ChallengePageQueryVariables
  >(QUERY, {
    variables: {id: profile.id, resync: true},
  })

  const onSubmit = React.useCallback(async (data) => {
    setSubmissionStatus('Connecting wallet...')

    const starknet = getStarknet({showModal: true})
    const [userWalletContractAddress] = await starknet.enable()
    if (!starknet) return

    setSubmissionStatus('Verifying required deposit size...')
    const depositSize = await getChallengeDepositSize()

    setSubmissionStatus('Ensuring sufficient balance...')
    const balance = await erc20GetBalanceOf(userWalletContractAddress)

    if (balance < depositSize) {
      toast.error(
        'You have insufficient funds to submit a challenge. Add funds to your wallet and try again.',
        {duration: 10000}
      )
      setSubmissionStatus(null)
      return
    }

    setSubmissionStatus('Authorizing challenge deposit...')
    await erc20Approve(starknet.signer, ZorroAddress, depositSize)

    setSubmissionStatus('Uploading evidence...')
    const cid = await cairoCompatibleAdd(data.evidence)

    setSubmissionStatus('Submitting challenge...')
    await submitChallenge(starknet.signer, profile.id, serializeCid(cid))

    setSubmissionStatus('Refreshing profile...')
    await refetchProfile()

    setSubmissionStatus(null)
  }, [])

  const formMethods = useForm()
  const {isSubmitting, isDirty, isValid, errors} = formMethods.formState

  return (
    <Stack>
      <Heading size="md">
        Challenge{' '}
        <InternalLink href={routes.profile({id: profile.id})}>
          Profile {profile.id}
        </InternalLink>
      </Heading>
      <Text>
        {/* TODO: cache the real deposit sizes in our db and show them here. */}
        If you believe profile {profile.id} is invalid, you have the option to{' '}
        <strong>challenge</strong> it. Challenging this profile requires a
        deposit of {contractCache.challengeDepositSize} ETH. If your challenge
        succeeds you'll receive{' '}
        {contractCache.challengeDepositSize + contractCache.challengeRewardSize}{' '}
        ETH back, and if it fails the protocol treasury will keep your deposit.
      </Text>
      <Text>
        A profile can be successfully challenged for any of the following
        reasons:
      </Text>
      <OrderedList pl="8">
        <ListItem>
          It is a duplicate of another previously-submitted profile.
        </ListItem>
        <ListItem>
          It is controlled by someone other than the individual pictured.
        </ListItem>
        <ListItem>
          It doesn't belong to a real person (for example, it is a deepfake).
        </ListItem>
        <ListItem>It doesn't follow the submission guidelines.</ListItem>
      </OrderedList>
      <Text>
        Once you submit a challenge, it will be adjucated by a trusted member of
        the Zorro community. (We're working on an escalation path to appeal
        adjudications to{' '}
        <Link href="https://kleros.io/" isExternal>
          Kleros
        </Link>{' '}
        to avoid the risk of corrupted adjucators.)
      </Text>
      <Form onSubmit={onSubmit} formMethods={formMethods}>
        <FormControl my="4" isInvalid={'evidence' in errors} isRequired>
          <FormLabel>Challenge Evidence</FormLabel>
          <Textarea
            placeholder="Example: 'This profile was clearly recorded by the same person who created the older profile found at [...]'"
            minRows={5}
            as={ResizeTextarea}
            {...formMethods.register('evidence', {
              required: {value: true, message: 'Please provide evidence'},
              minLength: {
                value: 20,
                message: 'Evidence must be at least 20 characters long',
              },
            })}
          />
          {'evidence' in errors ? (
            <FormErrorMessage>{errors.evidence?.message}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Be sure to include enough evidence to convince the adjucator that
              the challenge is valid. If you submit insufficient evidence the
              adjudicator will rule against you and you'll lose your deposit.
            </FormHelperText>
          )}
        </FormControl>
        <Button
          colorScheme="red"
          type="submit"
          isLoading={submissionStatus != null}
          loadingText={submissionStatus}
        >
          Submit Challenge
        </Button>
      </Form>
    </Stack>
  )
}

const Success = (props: CellSuccessProps<ChallengePageQuery>) => {
  const profile = props.cachedProfile
  if (!profile) return <NotFoundPage />

  // TODO: use a flash message to explain why the challenge page isn't available in these states
  const profileRedirect = <Redirect to={routes.profile({id: profile.id})} />

  const bodyContent: {[key in StatusEnum]: ReactElement} = {
    NOT_CHALLENGED: <NotChallenged query={props} />,
    CHALLENGED: <Text>profile challenged</Text>,
    ADJUDICATION_ROUND_COMPLETED: null,
    APPEALED: profileRedirect,
    APPEAL_OPPORTUNITY_EXPIRED: profileRedirect,
    SUPER_ADJUDICATION_ROUND_COMPLETED: profileRedirect,
    SETTLED: profileRedirect,
  }

  return (
    <>
      <MetaTags title="Challenge Profile" />
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.profiles()} as={RLink}>
            Profiles
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RLink} href={routes.profile({id: profile.id})}>
            {profile.id}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage fontWeight="bold">
          <BreadcrumbLink>Challenge</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Stack maxW="2xl" mx="auto" my="8">
        <Card>
          <Stack spacing="6">
            <Box>
              <Stack>{bodyContent[profile.currentStatus]}</Stack>
            </Box>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}

export default createCell({QUERY, Success})
