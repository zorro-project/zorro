import {Box} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {toast, Toaster} from '@redwoodjs/web/toast'
import {useEffect} from 'react'
import NavBar from './NavBar'

const AppLayout: React.FC = ({children}) => {
  const {pathname} = useLocation()

  useEffect(() => {
    // dismiss all active toasts
    toast.dismiss()
  }, [pathname])

  return (
    <Box minH="100vh">
      <Toaster />
      <NavBar />
      <Box p={8}>{children}</Box>
    </Box>
  )
}

export default AppLayout
