import Icon from '@chakra-ui/icon'
import {Image} from '@chakra-ui/image'
import {Box, Stack, Text} from '@chakra-ui/layout'
import {Skeleton} from '@chakra-ui/skeleton'
import {routes} from '@redwoodjs/router'
import dayjs from 'dayjs'
import {FaCalendarCheck, FaCheck, FaTimes} from 'react-icons/fa'
import Identicon from 'src/components/Identicon'
import {RLink} from 'src/components/links'
import {ArrayElement, useDataFieldUrl} from 'src/lib/util'
import {ProfilesPageQuery} from 'types/graphql'

const ProfileCard = ({
  profile,
}: {
  profile:
    | ArrayElement<ProfilesPageQuery['cachedProfiles']['edges']>['node']
    | null
}) => {
  const photoUrl = useDataFieldUrl(profile?.photoCid)

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
      <Box position="absolute" top="2" right="3">
        <Text color="white" textShadow="1px 1px 5px black" fontWeight="bold">
          {profile.id}
        </Text>
      </Box>
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
