import {extendTheme} from '@chakra-ui/react'
import RLink from 'src/components/RLink'

const theme = extendTheme({
  components: {
    Link: {
      as: RLink, // TODO: not sure if this is actually working
      variants: {
        // you can name it whatever you want
        primary: ({colorScheme = 'blue'}) => ({
          color: `${colorScheme}.500`,
          _hover: {
            color: `${colorScheme}.400`,
          },
        }),
        btn: {
          color: 'teal.500',
          // fontWeight: 'bold',
          textAlign: 'center',
          _hover: {
            color: 'teal.800',
            textDecoration: 'none',
          },
        },
      },
      defaultProps: {
        // you can name it whatever you want
        variant: 'primary',
      },
    },
  },
})

export default theme
