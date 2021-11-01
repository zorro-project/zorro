import { Icon, Stack, StackProps, Text } from '@chakra-ui/react'
import { BsFillPersonCheckFill } from 'react-icons/bs'

const Logo = (props: StackProps) => {
  return (
    <Stack direction="row" align="center" {...props}>
      <Icon as={BsFillPersonCheckFill} color="blue.800" boxSize="8" />
      <Text color="blue.800" fontWeight="900" fontSize="2xl" pl="2">
        Nym ID
      </Text>
    </Stack>
  )
}

export default Logo
