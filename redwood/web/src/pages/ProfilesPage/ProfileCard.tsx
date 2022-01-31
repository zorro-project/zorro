import Icon from '@chakra-ui/icon'
import {Image} from '@chakra-ui/image'
import {Box, Stack, Text} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import dayjs from 'dayjs'
import {FaCalendarCheck, FaCheck, FaHourglass, FaTimes} from 'react-icons/fa'
import {RLink} from 'src/components/links'
import {cidToUrl} from 'src/lib/ipfs'
import {IterableElement} from 'type-fest'
import {ProfilesPageQuery} from 'types/graphql'

export type ItemType =
  | IterableElement<ProfilesPageQuery['optimisticallyApprovedRegs']>
  | NonNullable<
      IterableElement<NonNullable<ProfilesPageQuery['cachedProfiles']>['edges']>
    >['node']

const ItemCard: React.FC<{
  profile: ItemType
  style: React.CSSProperties
}> = ({profile, style}) => {
  if (profile.__typename == null) return null

  const isOptimistic = profile.__typename == 'RegistrationAttempt'

  const statusIcon = isOptimistic
    ? FaHourglass
    : profile.isVerified
    ? FaCheck
    : FaTimes

  const statusIconColor = isOptimistic
    ? 'yellow.500'
    : profile.isVerified
    ? 'green.500'
    : 'red.500'

  const statusText = isOptimistic
    ? 'Pending'
    : profile.isVerified
    ? 'Verified'
    : 'Not verified'

  return (
    <Box style={style} p={2}>
      <Box
        as={RLink}
        href={
          isOptimistic
            ? routes.pendingProfile({id: profile.ethereumAddress})
            : routes.profile({id: profile.id})
        }
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
          src={cidToUrl(profile.photoCid ?? '')}
          width="100%"
          height="100%"
          objectFit="cover"
          objectPosition="center"
          backgroundColor="gray.100"
          position="relative"
        />
        <Box position="absolute" top="2" right="3">
          <Text color="white" textShadow="1px 1px 5px black" fontWeight="bold">
            {!isOptimistic && profile.id}
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
              {dayjs(
                isOptimistic ? profile.reviewedAt : profile.submissionTimestamp
              ).format('MMM D, YYYY')}
            </Text>
          </Stack>
          <Stack direction="row" alignItems="center">
            <Icon as={statusIcon} color={statusIconColor} />
            <Text fontWeight="bold">{statusText}</Text>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

export default ItemCard
