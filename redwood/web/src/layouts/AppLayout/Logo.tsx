import {Icon, Stack, StackProps, Text} from '@chakra-ui/react'
import {FaMask} from 'react-icons/fa'

const Logo = (props: StackProps) => {
  return (
    <Stack direction="row" align="center" {...props}>
      <Icon as={FaMask} color="blue.800" boxSize="8" />
      <Text color="blue.800" fontWeight="900" fontSize="2xl">
        Zorro
      </Text>
    </Stack>
  )
}

export default Logo
