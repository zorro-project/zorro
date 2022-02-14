import {Image} from '@chakra-ui/image'
import {Box, Text, Flex} from '@chakra-ui/layout'
import {BoxProps} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {
  PendingStatus,
  VerifiedStatus,
  NotVerifiedStatus,
} from 'src/components/ProfileStatus'
import {RLink} from 'src/components/links'
import {cidToUrl} from 'src/lib/ipfs'
import {IterableElement} from 'type-fest'
import {ProfilesPageQuery} from 'types/graphql'

export type ProfileItemType =
  | IterableElement<ProfilesPageQuery['optimisticallyApprovedRegs']>
  | NonNullable<
      IterableElement<NonNullable<ProfilesPageQuery['cachedProfiles']>['edges']>
    >['node']

const ProfileItemCard: React.FC<
  {
    profileItem: ProfileItemType
  } & BoxProps
> = ({profileItem, ...rest}) => {
  if (profileItem.__typename == null) return null

  const isOptimistic = profileItem.__typename == 'RegistrationAttempt'

  const status = isOptimistic ? (
    <PendingStatus />
  ) : profileItem.isVerified ? (
    <VerifiedStatus />
  ) : (
    <NotVerifiedStatus />
  )

  return (
    <Box position="relative" {...rest}>
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
          {status}
          {!isOptimistic && <Text color="gray.500">#{profileItem.id}</Text>}
        </Flex>
      </Box>
    </Box>
  )
}

export default ProfileItemCard
