import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  AccordionButton,
  Heading,
  AccordionIcon,
  Stack,
  Icon,
  Text,
  Link,
  Table,
  Tbody,
  Td,
  Tr,
} from '@chakra-ui/react'
import dayjs from 'dayjs'
import { IconType } from 'react-icons'
import { BsFillArrowUpRightSquareFill } from 'react-icons/bs'
import { FaCalendarPlus, FaExclamationTriangle, FaGavel } from 'react-icons/fa'
import { cidToUrl } from 'src/lib/ipfs'
import { ProfilePageQuery } from 'types/graphql'

const Entry: React.FC<{
  icon: IconType
  timestamp: string
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
  profile: ProfilePageQuery['cachedProfile']
}> = ({ profile }) => (
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
            <Link href={cidToUrl(profile.challengeEvidenceCID)} isExternal>
              Challenger evidence
              <ExternalLinkIcon ml={1} />
            </Link>
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
                  ? 'Verified'
                  : 'Unverified'}
              </strong>{' '}
              (
              <Link href={cidToUrl(profile.adjudicatorEvidenceCID)} isExternal>
                Evidence
                <ExternalLinkIcon ml={1} />
              </Link>
              )
            </Text>
          }
        />
        <Entry
          icon={BsFillArrowUpRightSquareFill}
          title="Appealed"
          timestamp={profile.appealTimestamp}
          description={
            <Link href="https://kleros.io/" isExternal>
              View case on Kleros
              <ExternalLinkIcon ml={1} />
            </Link>
          }
        />
        <Entry
          icon={FaGavel}
          title="Appeal Decided"
          timestamp={profile.superAdjudicationTimestamp}
          description={
            <Text>
              Appeal Ruling:{' '}
              <strong>
                {profile.didSuperAdjudicatorVerifyProfile
                  ? 'Verified'
                  : 'Unverified'}
              </strong>
            </Text>
          }
        />
      </Tbody>
    </Table>
  </Stack>
)

export default History
