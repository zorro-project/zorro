import {AspectRatio, Box, Center} from '@chakra-ui/react'
import BeatLoader from 'react-spinners/BeatLoader'

const UserMediaBox: React.FC<{shouldShowLoadingIndicator?: boolean}> = ({
  shouldShowLoadingIndicator,
  children,
}) => {
  return (
    <AspectRatio
      ratio={16 / 9}
      width="100%"
      position="relative"
      backgroundColor="gray.700"
    >
      <Box>
        {shouldShowLoadingIndicator && (
          <Center position="absolute" left="0" right="0" top="0" bottom="0">
            <BeatLoader size={20} color="white" />
          </Center>
        )}
        <Center
          position="absolute"
          left="0"
          right="0"
          top="0"
          bottom="0"
          sx={{'img, video': {maxH: '100%'}}}
        >
          {children}
        </Center>
      </Box>
    </AspectRatio>
  )
}

export default UserMediaBox
