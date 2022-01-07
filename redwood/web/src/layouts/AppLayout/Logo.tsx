import {Stack, StackProps, Text} from '@chakra-ui/react'
import LogoSVG from 'src/logo.svg'

const Logo = (props: StackProps) => {
  return (
    <Stack direction="row" align="center" {...props}>
      <LogoSVG height="20" width="40" />
      <Text color="#805AD5" fontWeight="700" fontSize="2xl">
        Zorro
      </Text>
    </Stack>
  )
}

export default Logo
