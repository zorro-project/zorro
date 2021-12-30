import * as React from 'react'

import {ChakraProvider} from '@chakra-ui/react'
import {AppBackground} from '../src/layouts/AppLayout/AppLayout'
import theme from '../src/config/theme'

const withChakra = (StoryFn) => (
  <ChakraProvider theme={theme}>
    <StoryFn />
  </ChakraProvider>
)

const withBackground = (StoryFn) => (
  <AppBackground>
    <StoryFn />
  </AppBackground>
)

export const decorators = [withBackground, withChakra]
