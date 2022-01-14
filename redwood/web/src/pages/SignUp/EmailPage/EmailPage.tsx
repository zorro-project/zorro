import {
  Box,
  Button,
  Heading,
  Input,
  ListItem,
  Spacer,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react'
import {Redirect, routes} from '@redwoodjs/router'
import {MetaTags, useMutation} from '@redwoodjs/web'
import {useContext, useEffect, useRef, useState} from 'react'
import {RLink} from 'src/components/links'
import UserContext from 'src/layouts/UserContext'
import {CreateUserMutation, CreateUserMutationVariables} from 'types/graphql'
import SignUpLogo from '../SignUpLogo'

const EmailPage = () => {
  const user = useContext(UserContext)
  if (!user?.ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  if (user.user?.hasEmail) {
    // We don't support changing emails yet
    return <Redirect to={routes.signUpSubmit()} />
  }

  const [email, setEmail] = useState<string>('')
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const [createUser] = useMutation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(gql`
    mutation CreateUserMutation($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        hasEmail
      }
    }
  `)

  const focusRef = useRef<HTMLInputElement>(null)
  useEffect(() => focusRef.current?.focus(), [focusRef.current])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.ethereumAddress) return
    createUser({
      variables: {
        input: {
          ethereumAddress: user.ethereumAddress,
          email,
        },
      },
    })
    user.refetch()
  }

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flex: '1'}}>
      <Stack spacing="6" flex="1">
        <SignUpLogo />
        <MetaTags title="Email Notifications" />
        <Heading size="md" textAlign="center">
          Enter email for notifications
        </Heading>
        <Input
          type="email"
          name="email"
          placeholder="Email address"
          ref={focusRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Box>
          <Text>Get notified about:</Text>
          <UnorderedList stylePosition="inside">
            <ListItem>Challenges to your citizenship</ListItem>
            <ListItem>Citizenship expiration</ListItem>
          </UnorderedList>
        </Box>
        <Spacer display={['initial', 'none']} />
        <Button
          colorScheme="purple"
          alignSelf="center"
          type="submit"
          disabled={!emailValid}
        >
          Continue
        </Button>
        <Button
          variant="link"
          as={RLink}
          href={routes.signUpSubmit()}
          colorScheme="purple"
        >
          Skip
        </Button>
      </Stack>
    </form>
  )
  return null
}

export default EmailPage
