import { IconProps } from '@chakra-ui/icon'
import { FaCheck, FaGavel } from 'react-icons/fa'
import { ProfileStatus } from 'types/graphql'

type StatusConfig = { icon: any; iconColor: IconProps['color']; text: string }

export const STATUS_CONFIGS: Record<ProfileStatus, StatusConfig> = {
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
