import {
  Button,
  Flex,
  FlexProps,
  HStack,
  Icon,
  IconButton,
  Stack,
  StackProps,
  Text,
} from '@chakra-ui/react'
import { FaBitbucket, FaGithub, FaGoogle, FaSpotify } from 'react-icons/fa'
import { HiX } from 'react-icons/hi'
import { Card } from './Card'
import { HeadingGroup } from './HeadingGroup'

export const SocialAccountSettings = (props: StackProps) => (
  <Stack as="section" spacing="6" {...props}>
    <HeadingGroup
      title="Connected accounts"
      description="Connect your Chakra account to one or more provides"
    />
    <Card>
      <Stack spacing="5">
        <SocialAccount
          provider="Github"
          icon={FaGithub}
          username="dabestcoder03"
        />
        <SocialAccount provider="Google" icon={FaGoogle} iconColor="red.500" />
        <SocialAccount
          provider="Bitbucket"
          icon={FaBitbucket}
          iconColor="blue.500"
        />
        <SocialAccount
          provider="Spotify"
          icon={FaSpotify}
          iconColor="green.500"
          username="lisabeats09"
        />
      </Stack>
    </Card>
  </Stack>
)

interface SocialAccountProps extends FlexProps {
  provider: string
  icon: React.ElementType
  iconColor?: string
  username?: string
  onConnect?: () => void
  onDisconnect?: () => void
}

export const SocialAccount = (props: SocialAccountProps) => {
  const {
    provider,
    icon,
    iconColor,
    username,
    onConnect,
    onDisconnect,
    ...flexProps
  } = props
  return (
    <Flex align="center" {...flexProps}>
      <HStack width="10rem">
        <Icon as={icon} color={iconColor} />
        <Text fontSize="sm">{provider}</Text>
      </HStack>
      {username ? (
        <Text flex="1" fontWeight="semibold" fontSize="sm">
          {username}
        </Text>
      ) : (
        <Button size="sm" fontWeight="normal" onClick={onConnect}>
          Connect
        </Button>
      )}
      {username && (
        <IconButton
          size="sm"
          fontSize="md"
          variant="ghost"
          colorScheme="red"
          icon={<HiX />}
          aria-label="Disconnect"
          onClick={onDisconnect}
        />
      )}
    </Flex>
  )
}
