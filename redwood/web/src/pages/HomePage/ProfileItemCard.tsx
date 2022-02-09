import Icon from '@chakra-ui/icon'
import {Image} from '@chakra-ui/image'
import {Box, Text, HStack, Flex} from '@chakra-ui/layout'
import {routes} from '@redwoodjs/router'
import dayjs from 'dayjs'
import {
  BsClockHistory,
  BsQuestionOctagon,
  BsShieldFillCheck,
} from 'react-icons/bs'
import {RLink} from 'src/components/links'
import {cidToUrl} from 'src/lib/ipfs'
import {IterableElement} from 'type-fest'
import {ProfilesPageQuery} from 'types/graphql'

import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  relativeTime: {
    past: '%s old',
    future: '%s old',
    s: 'just now',
    m: 'just now',
    mm: '%d min',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1m',
    MM: '%dm',
    y: '1y',
    yy: '%dy',
  },
})

export type ProfileItemType =
  | IterableElement<ProfilesPageQuery['optimisticallyApprovedRegs']>
  | NonNullable<
      IterableElement<NonNullable<ProfilesPageQuery['cachedProfiles']>['edges']>
    >['node']

const ProfileItemCard: React.FC<{profileItem: ProfileItemType}> = ({
  profileItem,
}) => {
  if (profileItem.__typename == null) return null

  const isOptimistic = profileItem.__typename == 'RegistrationAttempt'

  const status = isOptimistic
    ? {
        icon: BsClockHistory,
        color: 'gray.500',
        text: 'pending',
        fontWeight: 'normal',
      }
    : profileItem.isVerified
    ? {
        icon: BsShieldFillCheck,
        color: 'green.500',
        text: 'verified',
        fontWeight: 'semibold',
      }
    : {
        icon: BsQuestionOctagon,
        text: 'not verified',
        color: 'gray.500',
        fontWeight: 'normal',
      }

  return (
    <Box position="relative">
      <Box
        as={RLink}
        href={
          isOptimistic
            ? routes.pendingProfile({id: profileItem.ethereumAddress})
            : routes.profile({id: profileItem.id})
        }
      >
        <Image
          src={cidToUrl(profileItem.photoCid ?? '')}
          w="180px"
          h="180px"
          objectFit="cover"
          objectPosition="center"
          borderRadius="5px"
        />
        <Flex justifyContent="space-between" pt="1">
          <HStack spacing="1">
            <Icon as={status.icon} color={status.color} />
            <Text color={status.color} fontWeight={status.fontWeight}>
              {status.text}
            </Text>
          </HStack>

          {/*
          <Text color="gray.500">
            {dayjs(
              isOptimistic
                ? profileItem.reviewedAt
                : profileItem.submissionTimestamp
            ).fromNow(true)}{' '}
            old
          </Text>
            */}

          {!isOptimistic && <Text color="gray.500">#{profileItem.id}</Text>}
        </Flex>
      </Box>
    </Box>
  )
}

export default ProfileItemCard
