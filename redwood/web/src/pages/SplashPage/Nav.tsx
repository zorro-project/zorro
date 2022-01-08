import * as React from 'react'
import {Box, Link, LinkProps, Flex, HStack} from '@chakra-ui/react'

import LogoSVG from 'src/logo.svg'

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

const Nav = () => {
  return (
    <Box as="header" height="20" position="relative">
      <Box
        height="100%"
        maxW="7xl"
        mx="auto"
        ps={{base: '6', md: '8'}}
        pe={{base: '5', md: '0'}}
      >
        <Flex as="nav" align="center" justify="space-between" height="100%">
          <LogoSVG height="40" width="40" />
          <HStack>
            <NavLink
              href="https://hackmd.io/@zorro-project/zorro-whitepaper"
              target="_blank"
            >
              WHITEPAPER
            </NavLink>
            <NavLink
              href="https://github.com/zorro-project/zorro"
              target="_blank"
            >
              GITHUB
            </NavLink>
            <NavLink href="https://discord.gg/Caj283PtN4" target="_blank">
              DISCORD
            </NavLink>
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}

export default Nav
