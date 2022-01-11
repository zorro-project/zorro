import {ChakraProvider} from '@chakra-ui/react'
import {FatalErrorBoundary, RedwoodProvider} from '@redwoodjs/web'
import {RedwoodApolloProvider} from '@redwoodjs/web/apollo'
import {DAppProvider} from '@usedapp/core'
import {Provider as ReactReduxProvider} from 'react-redux'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import store from 'src/state/store'
import type {} from 'types/environment'
import theme from './config/theme'
import {UserContextProvider} from './layouts/UserContext'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <ReactReduxProvider store={store}>
          <RedwoodApolloProvider>
            <DAppProvider config={{}}>
              <UserContextProvider>
                <ChakraProvider theme={theme}>
                  <Routes />
                </ChakraProvider>
              </UserContextProvider>
            </DAppProvider>
          </RedwoodApolloProvider>
        </ReactReduxProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
