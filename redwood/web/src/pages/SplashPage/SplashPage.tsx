import * as React from 'react'
import {
  Box,
  Button,
  Divider,
  Heading,
  SimpleGrid,
  Link,
  Stack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  MetaTags,
  useDisclosure,
} from '@chakra-ui/react'

import {FaShieldAlt, FaWind, FaVoteYea} from 'react-icons/fa'
import Nav from './Nav'
import {Feature} from './Feature'

const SplashPage = () => {
  return (
    <>
      <MetaTags
        title="Zorro: web3 citizenship"
        description="Proof of personhood with fast registration for democratic DAO voting, fair airdrops, etc"
        ogUrl="https://zorro.xyz"
        ogContentUrl="https://zorro.xyz/logo-twitter-card.png"
      />
      <Box>
        <Nav />
        <Box as="section" py="7.5rem">
          <Hero />
          <Divider my="20" opacity={1} />
          <Features />
        </Box>
      </Box>
    </>
  )
}

const Hero = () => (
  <>
    <Box maxW={{base: 'xl', md: '5xl'}} mx="auto" px={{base: '6', md: '8'}}>
      <Box textAlign="center">
        <Heading
          as="h1"
          size="3xl"
          fontWeight="extrabold"
          maxW="48rem"
          mx="auto"
          lineHeight="1.2"
          letterSpacing="tight"
        >
          Zorro: web3 citizenship
        </Heading>
        <Text fontSize="xl" mt="4" maxW="xl" mx="auto">
          Zorro is a fast way for people to prove that they're a unique person
          so they can obtain democratic DAO voting rights and other benefits.
        </Text>
      </Box>

      <Stack
        justify="center"
        direction={{base: 'column', md: 'row'}}
        mt="10"
        mb="20"
        spacing="4"
      >
        <LaunchButton />
        <IntegrateDaoButton />
      </Stack>
    </Box>
  </>
)

const LaunchButton = () => (
  <Button
    as="a"
    href="https://forms.gle/Z54sjjcLPTQgwgqBA"
    size="lg"
    colorScheme="purple"
    px="8"
    fontWeight="bold"
    fontSize="md"
    target="_blank"
  >
    Get notified when we launch
  </Button>
)

const IntegrateDaoButton = () => {
  const {isOpen, onOpen, onClose} = useDisclosure()

  return (
    <>
      <Button
        as="a"
        href="#"
        size="lg"
        px="8"
        fontWeight="bold"
        variant="outline"
        colorScheme="purple"
        fontSize="md"
        onClick={onOpen}
      >
        Integrate your DAO
      </Button>

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Integrate your DAO</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              We're happy to consult for free on how you can best make your DAO
              more democratic (whether by using Zorro or some other means).
            </Text>

            <Text pt="4">
              <Link
                href="https://discord.gg/Caj283PtN4"
                colorScheme="purple"
                isExternal
              >
                Ping us on Discord
              </Link>{' '}
              or{' '}
              <Link
                href="https://twitter.com/ZorroProtocol"
                colorScheme="purple"
                isExternal
              >
                DM on Twitter
              </Link>
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

const Features = () => (
  <Box
    as="section"
    maxW={{base: 'xl', md: '5xl'}}
    mx="auto"
    px={{base: '6', md: '8'}}
  >
    <SimpleGrid columns={{base: 1, md: 3}} spacing={{base: '12', md: '8'}}>
      <Feature title="Fast registration" icon={<FaWind />}>
        People can register in {'<'}5 minutes. Costs are covered by the
        protocol.
      </Feature>
      <Feature title="Privacy protection" icon={<FaShieldAlt />}>
        Actions taken after registering aren't publicly associated with your
        identity.
      </Feature>
      <Feature title="Snapshot voting integration" icon={<FaVoteYea />}>
        Plugs into <a href="https://snapshot.org/">Snapshot</a> so your DAO can
        have "1 person 1 vote", quadratic voting, etc.
      </Feature>
    </SimpleGrid>
  </Box>
)

export default SplashPage
