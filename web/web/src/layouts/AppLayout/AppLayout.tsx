import { Box } from '@chakra-ui/react'
import NavBar from './NavBar'

export const AppBackground = ({ children }) => (
  <Box p={8} bg="gray.50">
    {children}
  </Box>
)

export default function AppLayout({ children }) {
  return (
    <Box>
      <NavBar />
      <AppBackground>{children}</AppBackground>
    </Box>
  )
}
