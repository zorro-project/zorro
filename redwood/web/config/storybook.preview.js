import * as React from 'react'

import {ChakraProvider} from '@chakra-ui/react'
import theme from '../src/config/theme'

const withChakra = (StoryFn) => (
  <ChakraProvider theme={theme}>
    <StoryFn />
  </ChakraProvider>
)

export const decorators = [withChakra]
