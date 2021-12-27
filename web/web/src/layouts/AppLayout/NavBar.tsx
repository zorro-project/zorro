import {CloseIcon, HamburgerIcon} from '@chakra-ui/icons'
import {
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import {routes, useMatch} from '@redwoodjs/router'
import {BsGrid, BsPersonBadge, BsPersonPlus} from 'react-icons/bs'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import RLink from 'src/components/RLink'
import UserContext from '../UserContext'
import Logo from './Logo'

type NavItem = {
  label: string
  href?: string
  icon?: React.FC
}

const DesktopNavItem = (props: NavItem) => {
  const {icon, label, href = '#'} = props
  const active = useMatch(href).match

  return (
    <HStack
      as={RLink}
      href={href}
      aria-current={active ? 'page' : undefined}
      spacing="2"
      px="3"
      py="2"
      rounded="md"
      transition="all 0.2s"
      color="blue.400"
      border="1px solid white"
      _activeLink={{
        color: 'blue.600',
        borderColor: 'blue.600',
      }}
      _hover={{
        color: 'blue.900',
        borderColor: 'blue.900',
      }}
    >
      {icon && <Icon as={icon} mr="0.5" />}
      <Box fontWeight="semibold">{label}</Box>
    </HStack>
  )
}

const DesktopNav = ({navItems}: {navItems: Array<NavItem>}) => (
  <Stack direction={'row'} spacing={4}>
    {navItems.map((navItem) => (
      <DesktopNavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
)

const MobileNav = ({navItems}: {navItems: Array<NavItem>}) => (
  <Stack
    bg={useColorModeValue('white', 'gray.800')}
    p={4}
    display={{md: 'none'}}
  >
    {navItems.map((navItem) => (
      <DesktopNavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
)

const NavBar = () => {
  const {isOpen, onToggle} = useDisclosure()
  const user = React.useContext(UserContext)

  const navItems: Array<NavItem> = [
    {
      label: 'All Profiles',
      href: routes.profiles(),
      icon: BsGrid,
    },
  ]

  if (user.cachedProfile) {
    navItems.push({
      label: 'My Profile',
      href: routes.profile({id: user.cachedProfile.id}),
      icon: BsPersonBadge,
    })
  } else if (user.unsubmittedProfile) {
    navItems.push({
      label: 'Complete Profile',
      href: routes.createProfile(),
      icon: BsPersonPlus,
    })
  } else if (user) {
    navItems.push({
      label: 'Create Profile',
      href: routes.createProfile(),
      icon: BsPersonPlus,
    })
  }

  return (
    <>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{base: 2}}
        px={{base: 4}}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        <Flex
          flex={{base: 1, md: 'auto'}}
          ml={{base: -2}}
          display={{base: 'flex', md: 'none'}}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{base: 1}} justify={{base: 'center', md: 'start'}}>
          <Logo display={{base: 'none', md: 'flex'}} />
          <Flex display={{base: 'none', md: 'flex'}} ml={10}>
            <DesktopNav navItems={navItems} />
          </Flex>
        </Flex>

        <ConnectButton />
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <MobileNav navItems={navItems} />
      </Collapse>
    </>
  )
}

export default NavBar
