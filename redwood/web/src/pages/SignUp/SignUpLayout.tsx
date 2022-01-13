import {Flex} from '@chakra-ui/react'

const SignUpLayout: React.FC = ({children}) => (
  <Flex flexDir="column" maxW="md" width="100%" mx="auto" flex="1">
    {children}
  </Flex>
)

export default SignUpLayout
