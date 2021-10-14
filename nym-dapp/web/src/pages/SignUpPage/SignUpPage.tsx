import {
  Alert,
  AlertIcon,
  AlertDescription,
  Avatar,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  Stack,
  StackDivider,
  Switch,
  Text,
  useColorModeValue,
  Link,
  Input,
  FormHelperText,
} from '@chakra-ui/react'
import { routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'
import * as React from 'react'
import { Card } from './Card'
import ConnectButton from './ConnectButton'
import { FieldGroup } from './FieldGroup'
import { HeadingGroup } from './HeadingGroup'

const PageWrapper: React.FC = ({ children }) => (
  <>
    <MetaTags title="Sign Up" description="Sign up for a Nym account" />

    <Box
      bg={useColorModeValue('gray.50', 'gray.800')}
      px={{ base: '4', md: '10' }}
      py="16"
    >
      <Box maxW="xl" mx="auto">
        <Stack spacing="12">
          <Stack as="section" spacing="6">
            {children}
          </Stack>
        </Stack>
      </Box>
    </Box>
  </>
)

const SignUpPage = () => {
  return (
    <PageWrapper>
      <Heading size="lg">Create Account</Heading>
      <Text>
        Your Nym account is linked to your real identity, and each person can
        only create a single Nym account. If you already have a Nym account,{' '}
        <Link href={routes.signIn()} textDecor="underline">
          sign in
        </Link>
        .
      </Text>
      <Text>
        Once your account is active, you'll be able to create one or more{' '}
        <strong>Nym aliases</strong>. Nym aliases are private pseudonyms you can
        use to demonstrate that you're a real, unique human, without disclosing
        exactly <em>which</em> human you are.
      </Text>
      <Card>
        <Stack divider={<StackDivider />} spacing="8">
          <Stack spacing="6" width="full">
            <FormControl id="name" isRequired>
              <FormLabel>Name</FormLabel>
              <Input placeholder="Maria Wang" />
              <FormHelperText>
                This should be a full, real name. It will be public.
              </FormHelperText>
            </FormControl>
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input placeholder="mariawang@gmail.com" />
              <FormHelperText>Your email will stay private.</FormHelperText>
            </FormControl>
          </Stack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <FormLabel>Selfie</FormLabel>
              <FormHelperText>
                We need a picture of you to make sure you're unique.
              </FormHelperText>
            </FormControl>
            <Button>Take Selfie</Button>
          </Stack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <FormLabel>Video</FormLabel>
              <FormHelperText>
                Recording a video makes it harder for bots to get into the
                registry.
              </FormHelperText>
            </FormControl>
            <Button>Record Video</Button>
          </Stack>
          <Box>
            <FormControl isRequired>
              <FormLabel>Ethereum Wallet</FormLabel>
              <ConnectButton />
              <FormHelperText>
                Choose the Ethereum wallet you'd like to associate with your Nym
                account.
              </FormHelperText>
              <Alert status="warning" mt="4">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This wallet will be linked to your real identity, so use a new
                  one or one you don't mind revealing publicly.
                </AlertDescription>
              </Alert>{' '}
            </FormControl>
          </Box>
        </Stack>
      </Card>
      <Button type="submit" colorScheme="blue">
        Continue
      </Button>
    </PageWrapper>
  )
}

export default SignUpPage
