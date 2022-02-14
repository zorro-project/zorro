import {HStack, Icon, Text} from '@chakra-ui/react'
import {
  BsClockHistory,
  BsQuestionOctagon,
  BsShieldFillCheck,
} from 'react-icons/bs'
import {IconType} from 'react-icons/lib'

const Status = ({
  icon,
  text,
  color,
  fontWeight,
}: {
  icon: IconType
  text: string
  color: string
  fontWeight: string
}) => (
  <HStack spacing="1">
    <Icon as={icon} color={color} />
    <Text color={color} fontWeight={fontWeight}>
      {text}
    </Text>
  </HStack>
)

export const PendingStatus = () => (
  <Status
    icon={BsClockHistory}
    color="gray.500"
    text="pending"
    fontWeight="normal"
  />
)
export const VerifiedStatus = () => (
  <Status
    icon={BsShieldFillCheck}
    color="green.500"
    text="verified"
    fontWeight="semibold"
  />
)
export const NotVerifiedStatus = () => (
  <Status
    icon={BsQuestionOctagon}
    color="gray.500"
    text="not verified"
    fontWeight="normal"
  />
)
