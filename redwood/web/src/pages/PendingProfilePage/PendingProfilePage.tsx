import {Box, Divider, Heading, Icon, Stack, Text} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {MetaTags, useQuery} from '@redwoodjs/web'
import {FaHourglass} from 'react-icons/fa'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {watchRegAttempt} from 'src/lib/pusher'
import {useGuard} from 'src/lib/useGuard'
import NotFoundPage from 'src/pages/NotFoundPage'
import {
  PendingProfilePageQuery,
  PendingProfilePageQueryVariables,
} from 'types/graphql'
import {Breadcrumbs} from '../ProfilePage/ProfilePage'

const PendingProfilePage: React.FC<{id: string}> = ({id}) => {
  const {data, refetch} = useQuery<
    PendingProfilePageQuery,
    PendingProfilePageQueryVariables
  >(
    gql`
      query PendingProfilePageQuery($ethereumAddress: ID!) {
        registrationAttempt: optimisticallyApprovedReg(
          ethereumAddress: $ethereumAddress
        ) {
          approved
          videoCid
          photoCid
          profileId
          ethereumAddress
        }
      }
    `,
    {variables: {ethereumAddress: id}}
  )

  const registration = data?.registrationAttempt

  // If the profile has been confirmed on-chain, take you to the submitted profile page.
  useGuard(
    !data || data.registrationAttempt?.profileId == null,
    () =>
      routes.profile({id: data!.registrationAttempt!.profileId!.toString()}),
    {toast: {status: 'success', title: 'Profile confirmed'}}
  )

  // Auto-reload the query to redirect us to the profile page if the profile has been confirmed on-chain.
  watchRegAttempt(registration, refetch)

  if (!data) return null
  if (!registration?.approved) return <NotFoundPage />

  return (
    <>
      <MetaTags title="Pending Profile" />
      <Breadcrumbs pageTitle="Pending Profile" />
      <Stack w="xl" maxW="100%" mx="auto" my="8" spacing="6">
        <Heading size="md">Pending Profile</Heading>
        <Stack direction="row" alignItems="center">
          <Icon as={FaHourglass} color="yellow.500" />
          <Text>
            This profile has been notarized and submitted on-chain. It should go
            live and be assigned an ID in the next few minutes.
          </Text>
        </Stack>
        <Divider />
        <Heading size="md" textAlign="center">
          Photo & Video
        </Heading>
        <Stack direction="row" spacing="4">
          <Box flex="1">
            <PhotoBox photo={registration.photoCid} />
          </Box>
          <Box flex="1">
            <VideoBox video={registration.videoCid} />
          </Box>
        </Stack>
      </Stack>
    </>
  )
}

export default PendingProfilePage
