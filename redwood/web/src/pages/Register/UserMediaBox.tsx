import {AspectRatio, Box, BoxProps} from '@chakra-ui/react'

const UserMediaBox: React.FC<BoxProps> = (props) => {
  return (
    <AspectRatio
      ratio={4 / 3}
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Box>
        <Box {...props} />
      </Box>
    </AspectRatio>
  )
}

export default UserMediaBox
