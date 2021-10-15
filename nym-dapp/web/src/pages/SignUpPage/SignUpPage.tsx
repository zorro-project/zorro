import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Link,
  Stack,
  StackDivider,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'
import { FormProvider, useForm } from 'react-hook-form'
import { useEthers } from '@usedapp/core'

import { Card } from './Card'
import ConnectButton from './ConnectButton'
import SelfieField from 'src/pages/SignUpPage/SelfieField'
import VideoField from 'src/pages/SignUpPage/VideoField'

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
  const methods = useForm({ mode: 'onChange' })
  const { account } = useEthers()

  const formValid = methods.formState.isValid && account != null
  console.log(methods.formState.isValid, methods.formState.errors)

  return (
    <PageWrapper>
      <FormProvider {...methods}>
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
          <strong>Nym aliases</strong>. Nym aliases are private pseudonyms you
          can use to demonstrate that you're a real, unique human, without
          disclosing exactly <em>which</em> human you are.
        </Text>
        <Card>
          <Stack divider={<StackDivider />} spacing="8">
            <Box>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                alignItems="center"
                width="full"
                spacing="4"
              >
                <FormControl isRequired flex="1">
                  <FormLabel>Ethereum Wallet</FormLabel>
                  <FormHelperText>
                    Choose the Ethereum wallet you'd like to associate with your
                    Nym account.
                  </FormHelperText>
                </FormControl>
                <ConnectButton />
              </Stack>
              <Alert status="warning" mt="4">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This wallet will be linked to your real identity, so use a new
                  one or one you don't mind revealing publicly.
                </AlertDescription>
              </Alert>{' '}
            </Box>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              alignItems="center"
              width="full"
              spacing="4"
            >
              <FormControl isRequired flex="1">
                <FormLabel>Selfie</FormLabel>
                <FormHelperText>
                  We need a picture of you to make sure you're a unique human.
                </FormHelperText>
              </FormControl>
              <SelfieField />
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
              <VideoField />
            </Stack>
          </Stack>
        </Card>
        <Button type="submit" colorScheme="blue" disabled={!formValid}>
          Continue
        </Button>
      </FormProvider>
    </PageWrapper>
  )
}

export default SignUpPage
