import {Flex, useToast} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {useEffect} from 'react'
import NavBar from './NavBar'

// Don't run this code within AppLayout itself to avoid re-rendering the page
// chrome every time we navigate to a new page.
const LayoutEffects = () => {
  const {pathname} = useLocation()
  const toast = useToast()

  // dismiss all active toasts
  useEffect(toast.closeAll, [pathname])
  return null
}

const AppLayout: React.FC = ({children}) => (
  <Flex flexDir="column" minH="100vh">
    <NavBar />
    <Flex flexDir="column" p={8} flex="1">
      {children}
    </Flex>
    <LayoutEffects />
  </Flex>
)

export default AppLayout
