import {Heading, Stack} from '@chakra-ui/layout'
import {Table, Tbody, Th, Thead, Tr} from '@chakra-ui/react'
import {MetaTags, useQuery} from '@redwoodjs/web'
import {requireRole} from 'src/lib/guards'
import {UnsubmittedProfilesQuery} from 'types/graphql'
import UnsubmittedProfile from './UnsubmittedProfile'

const UnsubmittedProfilesPage = () => {
  requireRole('NOTARY')
  // const {authenticatedUser} = useUser()
  // useGuard(
  //   authenticatedUser?.roles?.includes('NOTARY'),
  //   routes.authenticate({next: routes.unsubmittedProfiles()}),
  //   {toast: {title: 'You must be a notary to access this page.'}}
  // )

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
    <Stack>
      <MetaTags title="Unsubmitted Profiles" />
      <Heading size="lg">Unsubmitted Profiles</Heading>
      <Table variant="simple" background="white" mt="8">
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
    </Stack>
  )
}

export default UnsubmittedProfilesPage
