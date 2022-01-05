import {Heading} from '@chakra-ui/layout'
import {Table, Tbody, Th, Thead, Tr} from '@chakra-ui/react'
import {MetaTags, useQuery} from '@redwoodjs/web'
import {Card} from 'src/components/Card'
import {UnsubmittedProfilesQuery} from 'types/graphql'
import UnsubmittedProfile from './UnsubmittedProfile'

const UnsubmittedProfilesPage = () => {
  const {data} = useQuery<UnsubmittedProfilesQuery>(gql`
    query UnsubmittedProfilesQuery {
      unsubmittedProfiles(pendingReview: true) {
        id
        photoCid
        videoCid
        ethereumAddress
      }
    }
  `)

  return (
    <>
      <MetaTags title="Unsubmitted Profiles" />
      <Heading size="lg">Unsubmitted Profiles</Heading>
      <Card mt="6">
        <Table variant="simple" background="white">
          <Thead>
            <Tr>
              <Th>Address</Th>
              <Th>Photo</Th>
              <Th>Video</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.unsubmittedProfiles.map((profile) => (
              <UnsubmittedProfile key={profile.id} profile={profile} />
            ))}
          </Tbody>
        </Table>
      </Card>
    </>
  )
}

export default UnsubmittedProfilesPage
