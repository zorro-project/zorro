import {Flex} from '@chakra-ui/react'

const SignUpLayout: React.FC = ({children}) => {
  return (
    <Flex flexDir="column" minH="100vh" background="gray.200">
      <Flex
        flexDir="column"
        maxW="lg"
        width="100%"
        mx="auto"
        flex="1"
        background="white"
        px="12"
        py="16"
      >
        {children}
      </Flex>
    </Flex>
  )
}

export default SignUpLayout
