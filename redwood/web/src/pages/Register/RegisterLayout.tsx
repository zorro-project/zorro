import {Flex} from '@chakra-ui/react'
import {GuardHandler} from 'src/lib/useGuard'

const RegisterLayout: React.FC = ({children}) => {
  return (
    <Flex
      flexDir="column"
      flex="1"
      background="gray.200"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        flexDir="column"
        maxW="lg"
        width="100%"
        mx="auto"
        flex={{base: 1, md: '0 1 650px'}}
        background="white"
        shadow="md"
        style={{position: 'relative'}}
        id="register-content"
      >
        <GuardHandler>{children}</GuardHandler>
      </Flex>
    </Flex>
  )
}

export default RegisterLayout
