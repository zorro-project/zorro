import {Box, Stack, useToast} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {useEffect} from 'react'
import NavBar from './NavBar'

const AppLayout: React.FC = ({children}) => {
  const {pathname} = useLocation()
  const toast = useToast()

  // dismiss all active toasts
  useEffect(toast.closeAll, [pathname])

  return (
    <Stack minH="100vh">
      <NavBar />
      <Box p={8} flex="1" display="flex" alignItems="" width="100%">
        {children}
      </Box>
    </Stack>
  )
}

export default AppLayout
