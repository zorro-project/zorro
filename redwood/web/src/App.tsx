import {AuthProvider} from '@redwoodjs/auth'

import {ChakraProvider} from '@chakra-ui/react'
import {FatalErrorBoundary, RedwoodProvider} from '@redwoodjs/web'
import {RedwoodApolloProvider} from '@redwoodjs/web/apollo'
import {Provider as EthersProvider} from 'wagmi'
import {Provider as ReactReduxProvider} from 'react-redux'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import store from 'src/state/store'
import type {} from 'types/environment'
import theme from './config/theme'
import {UserContextProvider} from './layouts/UserContext'
import authClient from './lib/authClient'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <EthersProvider autoConnect>
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
        </EthersProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
