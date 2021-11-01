import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/breadcrumb'
import { Button, ButtonGroup } from '@chakra-ui/button'
import Icon from '@chakra-ui/icon'
import { ExternalLinkIcon } from '@chakra-ui/icons'
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
import { Card } from 'src/components/Card'
import Identicon from 'src/components/Identicon'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { ProfilePageQuery } from 'types/graphql'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import { STATUS_CONFIGS } from './types'

const QUERY = gql`
  query ProfilePageQuery($id: ID!) {
    cachedProfile(ethAddress: $id) {
      nymId
      ethAddress
      photoCID
      videoCID
      status
      createdTimestamp
    }
  }
`

const Profile = ({
  profile,
}: {
  profile: ProfilePageQuery['cachedProfile']
}) => {
  const { ethAddress, photoCID, videoCID, status } = profile

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
                <PhotoBox photo={photoCID} />
              </Box>
              <Box flex="1">
                <Heading size="md">Video</Heading>
                <VideoBox video={videoCID} />
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

const Success = ({ cachedProfile }: CellSuccessProps<ProfilePageQuery>) =>
  cachedProfile ? <Profile profile={cachedProfile} /> : <NotFoundPage />

const ProfilePageCell = createCell({ QUERY, Success })

const ProfilePage = ({ id }) => <ProfilePageCell id={id} />

export default ProfilePage
