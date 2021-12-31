import {extendTheme} from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'gray.50'
      }
    }
  },
  components: {
    Link: {
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
