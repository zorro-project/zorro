import {ChakraProvider} from '@chakra-ui/react'
import {FatalErrorBoundary, RedwoodProvider} from '@redwoodjs/web'
import {RedwoodApolloProvider} from '@redwoodjs/web/apollo'
import {DAppProvider} from '@usedapp/core'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import theme from './config/theme'
import {UserContextProvider} from './layouts/UserContext'

// Just make need to make sure this file gets loaded somewhere
import type {} from 'types/environment'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider>
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
