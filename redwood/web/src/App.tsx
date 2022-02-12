import {AuthProvider} from '@redwoodjs/auth'

import {ChakraProvider} from '@chakra-ui/react'
import {FatalErrorBoundary, RedwoodProvider} from '@redwoodjs/web'
import {RedwoodApolloProvider} from '@redwoodjs/web/apollo'
import {WagmiProvider} from 'wagmi'
import {Provider as ReactReduxProvider} from 'react-redux'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import store from 'src/state/store'
import type {} from 'types/globals'
import theme from './config/theme'
import {UserContextProvider} from './layouts/UserContext'
import authClient from './lib/authClient'
import connectors from './components/connect/connectors'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <WagmiProvider autoConnect connectors={Object.values(connectors)}>
          <ReactReduxProvider store={store}>
            <AuthProvider type="custom" client={authClient}>
              <RedwoodApolloProvider>
                <UserContextProvider>
                  <ChakraProvider theme={theme}>
                    <Routes />
                  </ChakraProvider>
                </UserContextProvider>
              </RedwoodApolloProvider>
            </AuthProvider>
          </ReactReduxProvider>
        </WagmiProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
