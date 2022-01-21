import {AspectRatio, AspectRatioProps, Box} from '@chakra-ui/react'
import {useAppSelector} from 'src/state/store'

const UserMediaBox: React.FC<AspectRatioProps> = (props) => {
  const {aspectRatio} = useAppSelector((state) => state.signUp)

  if (!aspectRatio) {
    return <Box background="gray.200" {...props} />
  }

  return (
    <AspectRatio
      ratio={aspectRatio}
      background="gray.200"
      width="100%"
      {...props}
    />
  )
}

export default UserMediaBox
