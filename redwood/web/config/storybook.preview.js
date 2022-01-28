import * as React from 'react'

import {ChakraProvider} from '@chakra-ui/react'
import theme from '../src/config/theme'

const withChakra = (StoryFn) => (
  <ChakraProvider theme={theme}>
    <StoryFn />
  </ChakraProvider>
)
import {ActivePageContextProvider} from '@redwoodjs/router/dist/ActivePageContext'

const withActivePageContext = (StoryFn) => (
  <ActivePageContextProvider value={{loadingState: {}}}>
    <StoryFn />
  </ActivePageContextProvider>
)

export const decorators = [withChakra, withActivePageContext]

export const parameters = {
  options: {
    storySort: {
      method: 'alphabetical',
    },
  },
}
