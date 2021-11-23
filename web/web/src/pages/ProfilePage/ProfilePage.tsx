import { Accordion, AccordionItem, AccordionPanel } from '@chakra-ui/accordion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/breadcrumb'
import Icon from '@chakra-ui/icon'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Box, Divider, Heading, Link, Stack, Text } from '@chakra-ui/layout'
import { routes } from '@redwoodjs/router'
import { CellSuccessProps, createCell, MetaTags } from '@redwoodjs/web'
import dayjs from 'dayjs'
import React from 'react'
import { FaCalendarPlus } from 'react-icons/fa'
import { Card } from 'src/components/Card'
import Identicon from 'src/components/Identicon'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { ProfilePageQuery } from 'types/graphql'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import ChallengePanel from './ChallengePanel'
import ProfileAccButton from './ProfileAccButton'
import { STATUS_CONFIGS } from './types'

const QUERY = gql`
  query ProfilePageQuery($id: ID!) {
    cachedProfile(address: $id) {
      id
      address
      photoCID
      videoCID
      status
      submissionTimestamp
    }
  }
`

const Profile = ({
  profile,
}: {
  profile: ProfilePageQuery['cachedProfile']
}) => {
  const { address, photoCID, videoCID, status } = profile

  const statusConfig = STATUS_CONFIGS[status]

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
          <BreadcrumbLink>{address}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Stack maxW="2xl" mx="auto" my="8">
        <Card>
          <Stack spacing="6">
            <Box>
              <Stack direction="row" align="center">
                <Identicon size={40} account={address} />
                <Stack>
                  <Heading size="md" wordBreak="break-all">
                    <Link
                      display="flex"
                      alignItems="center"
                      href={`https://etherscan.io/address/${address}`}
                      isExternal
                      color="gray.600"
                    >
                      {address}
                      <ExternalLinkIcon ml={1} />
                    </Link>
                  </Heading>
                  <Stack direction="row" alignItems="center">
                    <Icon
                      as={statusConfig.icon}
                      color={statusConfig.iconColor}
                    />
                    <Text>{statusConfig.text}</Text>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Divider />
            <Stack direction={{ base: 'column', md: 'row' }} spacing="4">
              <Box flex="1">
                <Heading size="md">Photo</Heading>
                <PhotoBox photo={photoCID} />
              </Box>
              <Box flex="1">
                <Heading size="md">Video</Heading>
                <VideoBox video={videoCID} />
              </Box>
            </Stack>
            <Accordion allowToggle allowMultiple>
              <AccordionItem>
                <ProfileAccButton text="History" />
                <AccordionPanel>
                  <Stack direction="row" alignItems="center">
                    <Icon as={FaCalendarPlus} />
                    <Text>
                      <strong>Created</strong>{' '}
                      {dayjs(profile.submissionTimestamp).format(
                        'MMM D, YYYY H:mm:ssZ'
                      )}
                    </Text>
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
              <ChallengePanel profile={profile} />
            </Accordion>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}

const Success = ({ cachedProfile }: CellSuccessProps<ProfilePageQuery>) =>
  cachedProfile ? <Profile profile={cachedProfile} /> : <NotFoundPage />

const ProfilePageCell = createCell({ QUERY, Success })

const ProfilePage = ({ id }) => <ProfilePageCell id={id} />

export default ProfilePage
