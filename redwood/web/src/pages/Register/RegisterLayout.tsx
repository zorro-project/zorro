import {Flex} from '@chakra-ui/react'

const RegisterLayout: React.FC = ({children}) => {
  return (
    <Flex
      flexDir="column"
      minH="100vh"
      background="gray.200"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        flexDir="column"
        maxW="lg"
        width="100%"
        mx="auto"
        flex="0 1 600px"
        background="white"
        px="12"
        py="16"
        shadow="md"
      >
        {children}
      </Flex>
    </Flex>
  )
}

export default RegisterLayout
