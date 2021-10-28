import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/breadcrumb'
import { Button, ButtonGroup } from '@chakra-ui/button'
import Icon from '@chakra-ui/icon'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image'
import {
  Box,
  Heading,
  Link,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/layout'
import { routes } from '@redwoodjs/router'
import { CellSuccessProps, createCell, MetaTags } from '@redwoodjs/web'
import dayjs from 'dayjs'
import React from 'react'
import { FaCalendarPlus } from 'react-icons/fa'
import ReactPlayer from 'react-player'
import { Card } from 'src/components/Card'
import Identicon from 'src/components/ConnectButton/Identicon'
import { useDataFieldUrl } from 'src/lib/util'
import { Profile_Page } from 'types/graphql'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import { STATUS_CONFIGS } from './types'

const QUERY = gql`
  query PROFILE_PAGE($id: ID!) {
    cachedProfile(id: $id) {
      nymId
      ethAddress
      photoCID
      videoCID
      status
      createdTimestamp
    }
  }
`

const Profile = ({ profile }: { profile: Profile_Page['cachedProfile'] }) => {
  const { ethAddress, photoCID, videoCID, status } = profile

  const statusConfig = STATUS_CONFIGS[status]

  const photoUrl = useDataFieldUrl(photoCID)
  const videoUrl = useDataFieldUrl(videoCID)

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
          <BreadcrumbLink>{ethAddress}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Stack maxW="2xl" mx="auto" my="8">
        <Card>
          <Stack divider={<StackDivider />} spacing="6">
            <Box>
              <Stack direction="row" align="center">
                <Identicon size={40} account={ethAddress} />
                <Stack>
                  <Heading size="md" wordBreak="break-all">
                    <Link
                      display="flex"
                      alignItems="center"
                      href={`https://etherscan.io/address/${ethAddress}`}
                      isExternal
                      color="gray.600"
                    >
                      {ethAddress}
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
            <Stack direction={{ base: 'column', md: 'row' }} spacing="4">
              <Box flex="1">
                <Heading size="md">Photo</Heading>
                <Image
                  src={photoUrl}
                  alt="Profile Photo"
                  borderRadius="lg"
                  shadow="lg"
                />
              </Box>
              <Box flex="1">
                <Heading size="md">Video</Heading>
                <Box overflow="hidden" borderRadius="lg" shadow="md">
                  <ReactPlayer
                    url={videoUrl}
                    controls
                    width="100%"
                    height="auto"
                  />
                </Box>
              </Box>
            </Stack>
            <Box>
              {' '}
              <Heading size="md" pb="2">
                Actions
              </Heading>
              <ButtonGroup>
                <Button colorScheme="red">Challenge</Button>
              </ButtonGroup>
            </Box>{' '}
            <Stack>
              <Heading size="md">Events</Heading>
              <Stack direction="row" alignItems="center">
                <Icon as={FaCalendarPlus} />
                <Text>
                  <strong>Created</strong>{' '}
                  {dayjs(profile.createdTimestamp).format(
                    'MMM D, YYYY H:mm:ssZ'
                  )}
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}

const Success = ({ cachedProfile }: CellSuccessProps<Profile_Page>) =>
  cachedProfile ? <Profile profile={cachedProfile} /> : <NotFoundPage />

const ProfilePageCell = createCell({ QUERY, Success })

const ProfilePage = ({ id }) => <ProfilePageCell id={id} />

export default ProfilePage
