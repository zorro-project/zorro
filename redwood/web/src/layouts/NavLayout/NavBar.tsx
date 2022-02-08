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
import {routes, useLocation, useMatch} from '@redwoodjs/router'
import {useEffect} from 'react'
import {BsGrid, BsPersonBadge, BsPersonPlus} from 'react-icons/bs'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'
import {RLink} from 'src/components/links'
import Logo from '../AppLayout/Logo'
import {useUser} from '../UserContext'

type NavItem = {
  label: string
  href?: string
  icon?: React.FC
}

const NavItem = (props: NavItem) => {
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
      color="purple.400"
      border="1px solid white"
      _activeLink={{
        color: 'purple.600',
        borderColor: 'purple.600',
      }}
      _hover={{
        color: 'purple.900',
        borderColor: 'purple.900',
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
      <NavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
)

const MobileNav = ({navItems}: {navItems: Array<NavItem>}) => (
  <Stack
    bg="white"
    p={4}
    display={{md: 'none'}}
    borderBottom={1}
    borderStyle={'solid'}
    borderColor={useColorModeValue('gray.200', 'gray.900')}
  >
    {navItems.map((navItem) => (
      <NavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
)

const NavBar = () => {
  const {isOpen, onToggle, onClose} = useDisclosure()
  const {loading, user, cachedProfile, registrationAttempt} = useUser()

  const {pathname} = useLocation()

  useEffect(onClose, [pathname])

  const navItems: Array<NavItem> = [
    {
      label: 'All Profiles',
      href: routes.profiles(),
      icon: BsGrid,
    },
  ]

  if (!loading) {
    if (cachedProfile) {
      navItems.push({
        label: 'My Profile',
        href: routes.profile({id: cachedProfile.id.toString()}),
        icon: BsPersonBadge,
      })
    } else if (registrationAttempt?.approved) {
      navItems.push({
        label: 'My Profile',
        href: routes.pendingProfile({id: user!.ethereumAddress}),
        icon: BsPersonBadge,
      })
    } else if (registrationAttempt) {
      navItems.push({
        label: 'Complete Registration',
        href: routes.registerSubmitted(),
        icon: BsPersonPlus,
      })
    } else {
      navItems.push({
        label: 'Register',
        href: routes.registerIntro(),
        icon: BsPersonPlus,
      })
    }
  }
  return (
    <Box>
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
      <Box position="relative" m="0">
        <Box pos="absolute" top="0" left="0" right="0" zIndex="10">
          <Collapse in={isOpen} animateOpacity>
            <MobileNav navItems={navItems} />
          </Collapse>
        </Box>
      </Box>
    </Box>
  )
}

export default NavBar
