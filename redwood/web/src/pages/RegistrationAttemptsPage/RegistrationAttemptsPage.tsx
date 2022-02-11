import {Heading, Spacer, Stack} from '@chakra-ui/layout'
import {
  Button,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags, useQuery} from '@redwoodjs/web'
import dayjs from 'dayjs'
import {RLink} from 'src/components/links'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {requireRole} from 'src/lib/guards'
import {IterableElement} from 'type-fest'
import {RegistrationAttemptsPageQuery} from 'types/graphql'
import {useNavigateToNextRegistrationAttempt} from '../RegistrationAttemptPage/RegistrationAttemptPage'

const DateRow = (props: {date: string | null | undefined; label: string}) =>
  props.date ? (
    <Tr>
      <Th fontSize="x-small">{props.label}</Th>
      <Td>{dayjs(props.date).format('MMM D, YYYY H:mm:ss')}</Td>
    </Tr>
  ) : null

const Registration: React.FC<{
  registration: IterableElement<
    RegistrationAttemptsPageQuery['latestRegistrations']
  >
}> = ({registration}) => (
  <Tr>
    <Td>
      <Stack>
        <Text>#{registration.id}</Text>
        <Link
          href={`https://etherscan.io/address/${registration.ethereumAddress}`}
          isExternal
          size="xs"
        >
          etherscan
        </Link>
        <Link
          as={RLink}
          href={routes.registrationAttempt({id: registration.id.toString()})}
        >
          View
        </Link>
      </Stack>
    </Td>
    <Td>
      <PhotoBox photo={registration.photoCid} width="36" />
    </Td>
    <Td>
      <VideoBox video={registration.videoCid} width="36" />
    </Td>
    <Td>
      <Table size="sm">
        <Tbody>
          <DateRow label="Submitted" date={registration.createdAt} />
          <DateRow label="Assigned" date={registration.notaryViewedAt} />
          <DateRow label="Reviewed" date={registration.reviewedAt} />
        </Tbody>
      </Table>
    </Td>
    <Td>
      <Stack>
        {registration.approved != null && (
          <Heading size="sm">
            {registration.approved ? 'Approved' : 'Denied'}
          </Heading>
        )}
        {registration.deniedReason && <Text>{registration.deniedReason}</Text>}
      </Stack>
    </Td>
  </Tr>
)

const RegistrationAttemptsPage = () => {
  requireRole('NOTARY')

  const {data} = useQuery<RegistrationAttemptsPageQuery>(gql`
    query RegistrationAttemptsPageQuery {
      latestRegistrations {
        id
        photoCid
        videoCid
        ethereumAddress

        createdAt
        notaryViewedAt
        reviewedAt

        approved
        deniedReason
      }
    }
  `)

  const navigateToNextRegistration = useNavigateToNextRegistrationAttempt()

  return (
    <Stack>
      <MetaTags title="Registration Attempts" />
      <Stack flexDir="row">
        <Heading size="lg">Registration Attempts</Heading>
        <Spacer />
        <Button onClick={navigateToNextRegistration} colorScheme="blue">
          Review Next
        </Button>
      </Stack>
      <Table variant="simple" background="white" mt="8">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Photo</Th>
            <Th>Video</Th>
            <Th>History</Th>
            <Th>Outcome</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data?.latestRegistrations.map((r) => (
            <Registration key={r.id} registration={r} />
          ))}
        </Tbody>
      </Table>
    </Stack>
  )
}

export default RegistrationAttemptsPage
