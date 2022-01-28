import {Heading, Stack} from '@chakra-ui/layout'
import {Table, Tbody, Th, Thead, Tr} from '@chakra-ui/react'
import {MetaTags, useQuery} from '@redwoodjs/web'
import {requireRole} from 'src/lib/guards'
import {UnreviewedRegistrationsPageQuery} from 'types/graphql'
import Registration from './Registration'

const UnreviewedRegistrationsPage = () => {
  requireRole('NOTARY')

  const {data} = useQuery<UnreviewedRegistrationsPageQuery>(gql`
    query UnreviewedRegistrationsPageQuery {
      unreviewedRegistrations {
        id
        photoCid
        videoCid
        ethereumAddress
        reviewedAt
      }
    }
  `)

  return (
    <Stack>
      <MetaTags title="Unreviewed Registrations" />
      <Heading size="lg">Unreviewed Registrations</Heading>
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
          {data?.unreviewedRegistrations
            .filter((r) => r.reviewedAt == null)
            .map((r) => (
              <Registration key={r.id} registration={r} />
            ))}
        </Tbody>
      </Table>
    </Stack>
  )
}

export default UnreviewedRegistrationsPage
