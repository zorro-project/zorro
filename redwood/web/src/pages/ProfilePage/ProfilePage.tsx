import {Breadcrumb, BreadcrumbItem, BreadcrumbLink} from '@chakra-ui/breadcrumb'
import Icon from '@chakra-ui/icon'
import {Box, Divider, Heading, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import {createCell, MetaTags} from '@redwoodjs/web'
import React from 'react'
import {FaCheck, FaTimes} from 'react-icons/fa'
import {RLink} from 'src/components/links'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {ProfilePageQuery} from 'types/graphql'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import ChallengeLink from './ChallengeLink'
import History from './History'

const QUERY = gql`
  query ProfilePageQuery($id: ID!) {
    cachedProfile(id: $id) {
      id
      currentStatus
      isVerified
      cid
      photoCid
      videoCid

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
      appealId
      superAdjudicationTimestamp
      didSuperAdjudicatorOverturnAdjudicator
    }
  }
`

export const Breadcrumbs = (props: {pageTitle: string}) => (
  <Breadcrumb>
    <BreadcrumbItem>
      <BreadcrumbLink href={routes.home()} as={RLink} fontWeight="bold">
        Home
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem isCurrentPage>
      <BreadcrumbLink>{props.pageTitle}</BreadcrumbLink>
    </BreadcrumbItem>
  </Breadcrumb>
)

const Success = (props: ProfilePageQuery) => {
  const profile = props.cachedProfile
  if (!profile) return <NotFoundPage />

  const {photoCid, videoCid} = profile

  return (
    <>
      <MetaTags title="Public Profile" />
      <Breadcrumbs pageTitle={profile.id} />

      <Stack w="xl" maxW="100%" mx="auto" my="8" spacing="6">
        <Stack>
          <Heading size="md">Profile {profile.id}</Heading>
          <Stack direction="row" alignItems="center">
            <Icon
              as={profile.isVerified ? FaCheck : FaTimes}
              color={profile.isVerified ? 'green.500' : 'red.500'}
            />
            <Text>{profile.isVerified ? 'Verified' : 'Not Verified'}</Text>
          </Stack>
        </Stack>
        <Divider />
        <Heading size="md" textAlign="center">
          Photo & Video
        </Heading>
        <Stack direction="row" spacing="4">
          {photoCid && (
            <Box flex="1">
              <PhotoBox photo={photoCid} />
            </Box>
          )}
          {videoCid && (
            <Box flex="1">
              <VideoBox video={videoCid} />
            </Box>
          )}
        </Stack>
        <History profile={profile} />
        <ChallengeLink profile={profile} />
      </Stack>
    </>
  )
}

export default createCell({QUERY, Success})
