import { useColorModeValue } from '@chakra-ui/color-mode'
import { Box, Stack } from '@chakra-ui/layout'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'

type AppLayoutProps = {
  children?: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.800')}
      p={{ base: '4', md: '10' }}
      pb="16"
      minH="100vh"
    >
      <Stack pb={{ base: 8, md: 0 }} direction="row" justify="flex-end">
        <ConnectButton />
      </Stack>
      {children}
    </Box>
  )
}

export default AppLayout
