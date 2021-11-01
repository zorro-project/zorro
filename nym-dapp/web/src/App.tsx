import { ChakraProvider } from '@chakra-ui/react'
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'
import { DAppProvider } from '@usedapp/core'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import theme from './config/theme'
import { UserContextProvider } from './layouts/UserContext'
import { cacheConfig } from './lib/apolloClient'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider graphQLClientConfig={{ cacheConfig }}>
          <DAppProvider config={{}}>
            <UserContextProvider>
              <ChakraProvider theme={theme}>
                <Routes />
              </ChakraProvider>
            </UserContextProvider>
          </DAppProvider>
        </RedwoodApolloProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
