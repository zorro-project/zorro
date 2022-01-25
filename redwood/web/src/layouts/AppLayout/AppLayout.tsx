import {Flex} from '@chakra-ui/react'
import {GuardHandler} from '../../lib/useGuard'
import {ToastManager} from './ToastManager'

const AppLayout: React.FC = ({children}) => (
  <GuardHandler>
    <Flex flexDir="column" minH="100vh">
      <ToastManager />
      {children}
    </Flex>
  </GuardHandler>
)

export default AppLayout
