import {Cached_Profiles, ProfileStatus} from 'types/graphql'
import {ArrayElement, useDataFieldUrl} from 'src/lib/util'
import {Box, Text, Stack} from '@chakra-ui/layout'
import {Skeleton} from '@chakra-ui/skeleton'
import {Image} from '@chakra-ui/image'
import Identicon from 'src/components/Identicon'
import dayjs from 'dayjs'
import {FaCalendarCheck, FaCheck, FaGavel, FaTimes} from 'react-icons/fa'
import Icon, {IconProps} from '@chakra-ui/icon'
import {routes} from '@redwoodjs/router'
import RLink from 'src/components/RLink'
import VerificationStatus from '../ProfilePage/VerificationStatus'

const ProfileCard = ({
  profile,
}: {
  profile:
    | ArrayElement<Cached_Profiles['cachedProfiles']['edges']>['node']
    | null
}) => {
  const photoUrl = useDataFieldUrl(profile?.photoCID)

  if (!profile) {
    return (
      <Box
        shadow="md"
        w="100%"
        h="100%"
        borderRadius="md"
        overflow="hidden"
        bgColor="white"
      >
        <Skeleton isLoaded={profile != null} height="100%"></Skeleton>
      </Box>
    )
  }

  return (
    <Box
      as={RLink}
      href={routes.profile({id: profile.id})}
      display="flex"
      shadow="md"
      w="100%"
      h="100%"
      borderRadius="md"
      overflow="hidden"
      bgColor="white"
      transition="transform 0.15s ease-in-out"
      position="relative"
      _hover={{
        borderColor: 'gray.300',
        transform: 'scale(1.03)',
      }}
    >
      <Image
        src={photoUrl}
        width="100%"
        height="100%"
        objectFit="cover"
        objectPosition="center"
        backgroundColor="gray.100"
        position="relative"
      />
      <Identicon
        account={profile.ethereumAddress}
        position="absolute"
        top="2"
        right="2"
      />
      <Stack
        position="absolute"
        w="100%"
        bottom="0"
        bgColor="rgba(255, 255, 255, 0.8)"
        align="center"
        spacing={0}
        fontSize="sm"
      >
        <Stack direction="row" alignItems="center">
          <Icon as={FaCalendarCheck} />
          <Text>
            {dayjs(profile.submissionTimestamp).format('MMM D, YYYY')}
          </Text>
        </Stack>
        <Stack direction="row" alignItems="center">
          <Icon
            as={profile.isVerified ? FaCheck : FaTimes}
            color={profile.isVerified ? 'green.500' : 'red.500'}
          />
          <Text fontWeight="bold">
            {profile.isVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}

export default ProfileCard
