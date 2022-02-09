import {routes} from '@redwoodjs/router'
import {Box, Button, Heading, Text, Flex, Spacer} from '@chakra-ui/react'
import {MetaTags, useQuery} from '@redwoodjs/web'
import ProfileItemCard, {ProfileItemType} from './ProfileItemCard'
import {RLink} from 'src/components/links'
import {useUser} from 'src/layouts/UserContext'

const HomePage = () => {
  const {
    loading: isUserLoading,
    user,
    cachedProfile,
    registrationAttempt,
    someDate,
  } = useUser()

  console.log('someDate', someDate)

  const {data, loading, fetchMore} = useQuery<ProfilesPageQuery>(QUERY, {
    notifyOnNetworkStatusChange: true, // XXX: look into purpose of this
    variables: {cursor: null},
    skip: isUserLoading,
  })

  if (loading) return null

  return (
    <>
      <MetaTags title="Home" />
      <Heading as="h1" size="xl" fontWeight="extrabold" mt="10">
        Zorro: web3 citizenship
      </Heading>
      {cachedProfile ? (
        <Profile profileItem={cachedProfile} />
      ) : registrationAttempt?.approved ? (
        <PendingProfile
          profileItem={{
            __typename: 'RegistrationAttempt',
            ...registrationAttempt,
          }}
        />
      ) : registrationAttempt ? (
        <UnfinishedRegistrationPrompt />
      ) : (
        <RegistrationPrompt />
      )}
      <LatestRegistrations mt="16" />
    </>
  )
}

const Profile = ({profileItem}: {profileItem: ProfileItemType}) => {
  return (
    <>
      <Heading as="h2" size="lg" mt="16">
        Your registration
      </Heading>
      Cached profile:
      <ProfileItemCard profileItem={profileItem} />
    </>
  )
}

const PendingProfile = ({profileItem}: {profileItem: ProfileItemType}) => {
  return (
    <>
      <Heading as="h2" size="lg" mt="16">
        Your registration
      </Heading>
      Pending profile:
      <ProfileItemCard profileItem={profileItem} />
    </>
  )
}

const UnfinishedRegistrationPrompt = () => {
  // NOTE: there are two states here:
  // - Waiting for feedback
  // - Got feedback
  return (
    <>
      <Heading as="h2" size="lg" mt="16">
        Your registration
      </Heading>

      <Text>Unfinished registration prompt - would link user in to finish</Text>
    </>
  )
}

const RegistrationPrompt = () => {
  return (
    <Box>
      <Text mt="4">
        Becoming a Zorro citizen will let you claim additional voting rights and
        other privileges.
      </Text>
      <Button
        mt="4"
        variant="register-primary"
        as={RLink}
        href={routes.registerIntro()}
      >
        Register
      </Button>
    </Box>
  )
}

const QUERY = gql`
  query ProfilesPageQuery($cursor: ID) {
    optimisticallyApprovedRegs {
      __typename
      ethereumAddress
      photoCid
      reviewedAt
    }

    cachedProfiles(first: 20, cursor: $cursor) {
      id
      edges {
        node {
          __typename
          ethereumAddress
          photoCid
          currentStatus
          submissionTimestamp
          id
          isVerified
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      count
    }
  }
`

// XXX: handle loading state
const LatestRegistrations = (props) => {
  const {data, loading, fetchMore} = useQuery<ProfilesPageQuery>(QUERY, {
    notifyOnNetworkStatusChange: true, // XXX: look into purpose of this
    variables: {cursor: null},
  })

  const profileItems: ProfileItemType[] = (
    (data?.optimisticallyApprovedRegs ?? []) as ProfileItemType[]
  ).concat(
    (data?.cachedProfiles?.edges?.map((edge) => edge?.node) ??
      []) as ProfileItemType[]
  )

  return (
    <Box {...props}>
      <Heading as="h2" size="lg">
        Latest registrations
      </Heading>
      <Flex wrap="wrap" columnGap="12" rowGap="10" mt="6">
        {profileItems.map((profileItem) => {
          return (
            <Box key={profileItem.ethereumAddress}>
              <ProfileItemCard profileItem={profileItem} />
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}

export default HomePage
