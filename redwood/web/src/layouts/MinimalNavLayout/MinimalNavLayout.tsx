import {Box, Link, LinkProps, Flex, HStack, Divider} from '@chakra-ui/react'

import LogoSVG from 'src/logo.svg'

import ConnectButton from 'src/components/connect/ConnectButton'
import {RLink} from 'src/components/links'
import {routes} from '@redwoodjs/router'

const MinimalNavLayout: React.FC = ({children}) => (
  <>
    <Nav />
    <Flex maxW="8xl" flexDirection="column" mx="auto" px="8">
      {children}
    </Flex>
    <Footer />
  </>
)

const Nav = () => {
  return (
    <Box height="20" px="8">
      <Flex as="nav" align="center" justify="space-between" height="100%">
        <RLink href={routes.home()}>
          <LogoSVG height="40" width="40" />
        </RLink>
        <HStack>
          <ConnectButton />
        </HStack>
      </Flex>
    </Box>
  )
}

const NavLink = (props: LinkProps) => {
  return (
    <Link
      display="block"
      py={2}
      px={3}
      color="purple.500"
      borderRadius="md"
      transition="all 0.2s"
      fontWeight="medium"
      fontSize="small"
      lineHeight="1.25rem"
      _hover={{bg: 'gray.100'}}
      {...props}
    />
  )
}

const Footer = () => {
  return (
    <Box py="12" px="8">
      <Divider borderColor="gray.300" />
      <HStack justifyContent="flex-end" pt="2">
        <NavLink
          href="https://hackmd.io/@zorro-project/zorro-whitepaper"
          target="_blank"
        >
          WHITEPAPER
        </NavLink>
        <NavLink href="https://github.com/zorro-project/zorro" target="_blank">
          GITHUB
        </NavLink>
        <NavLink href="https://twitter.com/ZorroProtocol" target="_blank">
          TWITTER
        </NavLink>
        <NavLink href="https://discord.gg/Caj283PtN4" target="_blank">
          DISCORD
        </NavLink>
      </HStack>
    </Box>
  )
}

export default MinimalNavLayout
