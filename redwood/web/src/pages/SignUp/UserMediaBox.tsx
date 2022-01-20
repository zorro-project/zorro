import {AspectRatio, AspectRatioProps, Box} from '@chakra-ui/react'
import {useAppSelector} from 'src/state/store'

const UserMediaBox: React.FC<AspectRatioProps> = (props) => {
  const {aspectRatio} = useAppSelector((state) => state.signUp)

  if (!aspectRatio) {
    return <Box {...props} />
  }

  return (
    <AspectRatio
      {...props}
      ratio={aspectRatio}
      background="black"
      width="100%"
    />
  )
}

export default UserMediaBox
