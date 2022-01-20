import {Flex} from '@chakra-ui/react'
import {ToastManager} from './ToastManager'

const AppLayout: React.FC = ({children}) => (
  <Flex flexDir="column" minH="100vh">
    <ToastManager />
    {children}
  </Flex>
)

export default AppLayout
