import { Heading } from '@chakra-ui/layout'
import { Table, Thead, Tr, Th, Tbody } from '@chakra-ui/react'
import { Link, routes } from '@redwoodjs/router'
import { MetaTags, useQuery } from '@redwoodjs/web'
import { Card } from 'src/components/Card'
import { Unsubmitted_Profiles_Page } from 'types/graphql'
import UnsubmittedProfile from './UnsubmittedProfile'

const UnsubmittedProfilesPage = () => {
  const { data } = useQuery<Unsubmitted_Profiles_Page>(gql`
    query UNSUBMITTED_PROFILES_PAGE {
      unsubmittedProfiles(pendingReview: true) {
        id
        selfieCID
        videoCID
        ethAddress
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
