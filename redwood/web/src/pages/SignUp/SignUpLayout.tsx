import {Flex, ScaleFade} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {useIsFirstRender} from 'usehooks-ts'

const SignUpLayout: React.FC = ({children}) => {
  const {pathname} = useLocation()

  const firstRender = useIsFirstRender()

  return (
    <Flex flexDir="column" minH="100vh" background="gray.200">
      <ScaleFade
        key={pathname}
        initialScale={0.9}
        in={true}
        transition={{enter: {duration: firstRender ? 0 : 0.25}}}
        style={{flex: 1, display: 'flex'}}
      >
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
      </ScaleFade>
    </Flex>
  )
}

export default SignUpLayout
