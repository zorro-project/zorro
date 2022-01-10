import {Box, BoxProps} from '@chakra-ui/react'

export const Card = (props: BoxProps) => (
  <Box
    bg="white"
    shadow="base"
    rounded="lg"
    p={{base: '4', md: '8'}}
    {...props}
  />
)
