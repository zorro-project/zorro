import {ExternalLinkIcon} from '@chakra-ui/icons'
import {
  Heading,
  Icon,
  Link,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react'
import dayjs from 'dayjs'
import {IconType} from 'react-icons'
import {BsFillArrowUpRightSquareFill} from 'react-icons/bs'
import {FaCalendarPlus, FaExclamationTriangle, FaGavel} from 'react-icons/fa'
import {cidToUrl} from 'src/lib/ipfs'
import {ProfilePageQuery} from 'types/graphql'

const Entry: React.FC<{
  icon: IconType
  timestamp?: string | null
  title: string
  description?: React.ReactNode
}> = (props) => {
  if (!props.timestamp) return null
  return (
    <Tr>
      <Td>
        <Text>
          <Icon as={props.icon} /> <strong>{props.title}</strong>
        </Text>
      </Td>
      <Td>{props.description}</Td>
      <Td textAlign="right">{dayjs(props.timestamp).format('MMM D, YYYY')}</Td>
    </Tr>
  )
}

const History: React.FC<{
  profile: NonNullable<ProfilePageQuery['cachedProfile']>
}> = ({profile}) => (
  <Stack>
    <Heading size="md" textAlign="center">
      Profile History
    </Heading>
    <Table>
      <Tbody>
        <Entry
          icon={FaCalendarPlus}
          title="Created"
          timestamp={profile.submissionTimestamp}
          description={
            profile.notarized ? 'Approved by notary' : 'Not notarized'
          }
        />
        <Entry
          icon={FaExclamationTriangle}
          title="Challenged"
          timestamp={profile.challengeTimestamp}
          description={
            profile.challengeEvidenceCid && (
              <Link href={cidToUrl(profile.challengeEvidenceCid)} isExternal>
                Challenger evidence
                <ExternalLinkIcon ml={1} />
              </Link>
            )
          }
        />
        <Entry
          icon={FaGavel}
          title="Adjudicated"
          timestamp={profile.adjudicationTimestamp}
          description={
            <Text>
              Ruling:{' '}
              <strong>
                {profile.didAdjudicatorVerifyProfile
                  ? 'verified'
                  : 'unverified'}
              </strong>{' '}
              {profile.adjudicatorEvidenceCid &&
                '(' +
                  (
                    <Link
                      href={cidToUrl(profile.adjudicatorEvidenceCid)}
                      isExternal
                    >
                      Evidence
                      <ExternalLinkIcon ml={1} />
                    </Link>
                  ) +
                  ')'}
            </Text>
          }
        />
        <Entry
          icon={BsFillArrowUpRightSquareFill}
          title="Appealed"
          timestamp={profile.appealTimestamp}
          description={
            <Link
              href={`https://resolve.kleros.io/cases/${profile.appealId}`}
              isExternal
            >
              View case on Kleros (Case {profile.appealId})
              <ExternalLinkIcon ml={1} />
            </Link>
          }
        />
        <Entry
          icon={FaGavel}
          title="Appeal decided"
          timestamp={profile.superAdjudicationTimestamp}
          description={
            <Text>
              Ruling:{' '}
              <strong>
                {profile.didSuperAdjudicatorOverturnAdjudicator
                  ? 'adjudication upheld'
                  : 'adjudication overturned'}
              </strong>
            </Text>
          }
        />
      </Tbody>
    </Table>
  </Stack>
)

export default History
