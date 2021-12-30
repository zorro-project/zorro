import {Accordion, AccordionItem, AccordionPanel} from '@chakra-ui/accordion'
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink} from '@chakra-ui/breadcrumb'
import Icon from '@chakra-ui/icon'
import {ExternalLinkIcon} from '@chakra-ui/icons'
import {Box, Divider, Flex, Heading, Link, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import {CellSuccessProps, createCell, MetaTags} from '@redwoodjs/web'
import dayjs from 'dayjs'
import React from 'react'
import {FaCalendarPlus, FaCheck, FaEthereum, FaTimes} from 'react-icons/fa'
import {Card} from 'src/components/Card'
import Identicon from 'src/components/Identicon'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {ProfilePageQuery} from 'types/graphql'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import ChallengePanel from './ChallengePanel'
import History from './History'

const QUERY = gql`
  query ProfilePageQuery($id: ID!) {
    cachedProfile(id: $id) {
      id
      ethereumAddress
      status
      isVerified
      cid
      photoCid
      videoCid

      ethereumAddress
      submissionTimestamp
      notarized
      challengeTimestamp
      challengerAddress
      challengeEvidenceCid
      ownerEvidenceCid

      adjudicationTimestamp
      adjudicatorEvidenceCid
      didAdjudicatorVerifyProfile

      appealTimestamp
      superAdjudicationTimestamp
      didSuperAdjudicatorVerifyProfile
    }
  }
`

const Profile = ({profile}: {profile: ProfilePageQuery['cachedProfile']}) => {
  const {ethereumAddress, photoCid, videoCid, status} = profile

  return (
    <>
      <MetaTags title="Public Profile" />
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.profiles()} fontWeight="bold">
            Profiles
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{profile.id}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Stack maxW="2xl" mx="auto" my="8">
        <Card>
          <Stack spacing="6">
            <Box>
              <Stack>
                <Heading size="md">Profile {profile.id}</Heading>
                <Stack direction="row" alignItems="center">
                  <Icon as={FaEthereum} />
                  <Link
                    display="flex"
                    alignItems="center"
                    href={`https://etherscan.io/address/${ethereumAddress}`}
                    isExternal
                    color={'black'}
                  >
                    {ethereumAddress}
                    <ExternalLinkIcon ml={1} />
                  </Link>
                </Stack>
                <Stack direction="row" alignItems="center">
                  <Icon
                    as={profile.isVerified ? FaCheck : FaTimes}
                    color={profile.isVerified ? 'green.500' : 'red.500'}
                  />
                  <Text>
                    {profile.isVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </Stack>
              </Stack>
            </Box>
            <Divider />
            <Heading size="md" textAlign="center">
              Photo & Video
            </Heading>
            <Stack direction="row" spacing="4">
              <Box flex="1">
                <PhotoBox photo={photoCid} />
              </Box>
              <Box flex="1">
                <VideoBox video={videoCid} />
              </Box>
            </Stack>
            <History profile={profile} />
          </Stack>
        </Card>
      </Stack>
    </>
  )
}

const Success = ({cachedProfile}: CellSuccessProps<ProfilePageQuery>) =>
  cachedProfile ? <Profile profile={cachedProfile} /> : <NotFoundPage />

const ProfilePageCell = createCell({QUERY, Success})

const ProfilePage = ({id}) => <ProfilePageCell id={id} />

export default ProfilePage
