import {Flex, ScaleFade} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'

const SignUpLayout: React.FC = ({children}) => {
  const {pathname} = useLocation()

  return (
    <Flex flexDir="column" minH="100vh" background="gray.200">
      <ScaleFade
        key={pathname}
        initialScale={0.9}
        in={true}
        style={{flex: 1, display: 'flex'}}
      >
        <Flex
          flexDir="column"
          maxW="lg"
          width="100%"
          mx="auto"
          flex="1"
          background="white"
          p="8"
        >
          {children}
        </Flex>
      </ScaleFade>
    </Flex>
  )
}

export default SignUpLayout
