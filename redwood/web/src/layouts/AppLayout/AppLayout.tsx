import {Flex} from '@chakra-ui/react'
import {GuardHandler} from '../../lib/useGuard'
import TestnetWarning from './TestnetWarning'
import {ToastManager} from './ToastManager'

const AppLayout: React.FC = ({children}) => (
  <GuardHandler>
    <Flex flexDir="column" minH="100vh">
      <ToastManager />
      <TestnetWarning />
      {children}
    </Flex>
  </GuardHandler>
)

export default AppLayout
