import {Flex} from '@chakra-ui/react'

const SignUpLayout: React.FC = ({children}) => (
  <Flex flexDir="column" maxW="md" mx="auto" flex="1">
    {children}
  </Flex>
)

export default SignUpLayout
