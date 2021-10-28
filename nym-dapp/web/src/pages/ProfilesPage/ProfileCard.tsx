import { Cached_Profiles, ProfileStatus } from 'types/graphql'
import { ArrayElement, useDataFieldUrl } from 'src/lib/util'
import { Box, Text, Stack } from '@chakra-ui/layout'
import { Skeleton } from '@chakra-ui/skeleton'
import { Image } from '@chakra-ui/image'
import Identicon from 'src/components/ConnectButton/Identicon'
import dayjs from 'dayjs'
import { FaCheck, FaGavel } from 'react-icons/fa'
import Icon, { IconProps } from '@chakra-ui/icon'

type StatusConfig = { icon: any; iconColor: IconProps['color']; text: string }

const STATUS_CONFIGS: Record<ProfileStatus, StatusConfig> = {
  submitted_via_notary: {
    icon: FaCheck,
    iconColor: 'green.500',
    text: 'Approved',
  },
  challenged: {
    icon: FaGavel,
    iconColor: 'yellow.500',
    text: 'Challenged',
  },
  deemed_valid: {
    icon: FaGavel,
    iconColor: 'green.500',
    text: 'Passed Challenge',
  },
  deemed_invalid: {
    icon: FaGavel,
    iconColor: 'red.500',
    text: 'Failed Challenge',
  },
}

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

  const statusConfig = STATUS_CONFIGS[profile.status]

  return (
    <Box
      as="a"
      href={`/profiles/${profile.nymId}`}
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
        account={profile.ethAddress}
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
        fontWeight="bold"
        fontSize="sm"
      >
        <Text>
          <Text as="span" color="gray.500">
            Submitted
          </Text>{' '}
          {dayjs(profile.createdTimestamp).format('MMM D, YYYY')}
        </Text>
        <Stack direction="row" alignItems="center">
          <Icon as={statusConfig.icon} color={statusConfig.iconColor} />
          <Text color="gray.500">{statusConfig.text}</Text>
        </Stack>
      </Stack>
    </Box>
  )
}

export default ProfileCard
