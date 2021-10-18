import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Link,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import { routes } from '@redwoodjs/router'
import SelfieField from 'src/pages/SignUpPage/SelfieField'
import VideoField from 'src/pages/SignUpPage/VideoField'
import { Card } from './Card'
import ConnectButton from './ConnectButton'

const EditView = () => {
  return (
    <Stack spacing="6">
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
    </Stack>
  )
}

export default EditView
