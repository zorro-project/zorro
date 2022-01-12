import {Box, Stack, useToast} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {useEffect} from 'react'
import NavBar from './NavBar'

// Don't run this code within AppLayout itself to avoid re-rendering the page
// chrome every time we navigate to a new page.
const LayoutCallbacks = () => {
  const {pathname} = useLocation()
  const toast = useToast()

  // dismiss all active toasts
  useEffect(toast.closeAll, [pathname])
  return null
}

const AppLayout: React.FC = ({children}) => (
  <Stack minH="100vh">
    <NavBar />
    <Box p={8} flex="1" display="flex" alignItems="" width="100%">
      {children}
    </Box>
    <LayoutCallbacks />
  </Stack>
)

export default AppLayout
