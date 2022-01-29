import {Box, BoxProps} from '@chakra-ui/react'
import LogoSVG from 'src/logo.svg'

export default function RegisterLogo(props: BoxProps) {
  return (
    <Box mx="auto" {...props}>
      <LogoSVG height="80" width="80" />
    </Box>
  )
}
