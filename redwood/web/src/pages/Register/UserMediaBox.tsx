import {AspectRatio, Box, BoxProps, Center, Spinner} from '@chakra-ui/react'
import BeatLoader from 'react-spinners/BeatLoader'

const UserMediaBox: React.FC<
  BoxProps & {shouldShowLoadingIndicator?: boolean}
> = ({shouldShowLoadingIndicator, ...props}) => {
  return (
    <AspectRatio
      ratio={16 / 9}
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="relative"
      backgroundColor="gray.700"
    >
      <Box>
        {shouldShowLoadingIndicator && (
          <Center position="absolute" left="0" right="0" top="0" bottom="0">
            <BeatLoader size={20} color="white" />
          </Center>
        )}
        <Box {...props} />
      </Box>
    </AspectRatio>
  )
}

export default UserMediaBox
