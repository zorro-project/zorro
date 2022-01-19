import {Flex} from '@chakra-ui/react'

const SignUpLayout: React.FC = ({children}) => (
  <Flex flexDir="column" minH="100vh" background="gray.200">
    <Flex
      flexDir="column"
      maxW="md"
      width="100%"
      mx="auto"
      flex="1"
      background="white"
      p="8"
    >
      {children}
    </Flex>
  </Flex>
)

export default SignUpLayout
