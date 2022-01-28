import {extendTheme, theme as baseTheme} from '@chakra-ui/react'
import {StyleFunctionProps} from '@chakra-ui/theme-tools'

const theme = extendTheme({
  styles: {
    global: {
      'html, body': {
        background: 'gray.50',
      },
    },
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
          color: 'purple.500',
          // fontWeight: 'bold',
          textAlign: 'center',
          _hover: {
            color: 'purple.800',
            textDecoration: 'none',
          },
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Button: {
      variants: {
        'register-primary': (props: StyleFunctionProps) => ({
          alignSelf: 'center',
          ...baseTheme.components.Button.variants.solid({
            ...props,
            colorScheme: 'purple',
          }),
          ...baseTheme.components.Button.sizes['lg'],
        }),
        'register-secondary': (props: StyleFunctionProps) => ({
          alignSelf: 'center',
          ...baseTheme.components.Button.variants.link({
            ...props,
            colorScheme: 'purple',
          }),
          ...baseTheme.components.Button.sizes['lg'],
        }),
      },
    },
  },
})

export default theme
