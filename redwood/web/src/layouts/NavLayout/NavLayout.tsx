import {Flex} from '@chakra-ui/react'
import NavBar from './NavBar'

const NavLayout: React.FC = ({children}) => (
  <Flex flexDir="column" minH="100vh">
    <NavBar />
    <Flex flexDir="column" p={8} flex="1">
      {children}
    </Flex>
  </Flex>
)

export default NavLayout
