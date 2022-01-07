import {AspectRatio, AspectRatioProps, Box} from '@chakra-ui/layout'
import {Image} from '@chakra-ui/image'
import {DataFieldType, useDataFieldUrl} from 'src/lib/util'
import ReactPlayer from 'react-player'

const SquareBox = (props: AspectRatioProps) => (
  <AspectRatio
    ratio={1}
    bgColor="gray.800"
    borderRadius="lg"
    shadow="md"
    overflow="hidden"
    objectFit="contain"
    {...props}
  />
)

export default SquareBox

export const PhotoBox = ({
  photo,
  ...props
}: AspectRatioProps & {photo: DataFieldType}) => {
  const photoUrl = useDataFieldUrl(photo)

  return (
    <SquareBox {...props}>
      <Box>
        <Image
          src={photoUrl}
          alt="Profile Photo"
          objectFit="contain"
          width="100%"
          height="100%"
        />
      </Box>
    </SquareBox>
  )
}

export const VideoBox = ({
  video,
  ...props
}: AspectRatioProps & {video: DataFieldType}) => {
  const videoUrl = useDataFieldUrl(video)

  return (
    <SquareBox
      {...props}
      // Hide annoying loading spinner https://stackoverflow.com/a/62786714/2141688
      sx={{
        'video::-webkit-media-controls': {
          visibility: 'hidden',
        },

        'video::-webkit-media-controls-enclosure': {
          visibility: 'visible',
        },
      }}
    >
      <ReactPlayer url={videoUrl} controls width="100%" height="100%" />
    </SquareBox>
  )
}
