import {
  Box,
  Button,
  Input,
  ListItem,
  Spacer,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import {useContext, useEffect, useRef, useState} from 'react'
import {RLink} from 'src/components/links'
import UserContext from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'
import {CreateUserMutation, CreateUserMutationVariables} from 'types/graphql'
import SignUpLogo from '../SignUpLogo'
import Title from '../Title'

const EmailPage = () => {
  const user = useContext(UserContext)
  if (!user?.ethereumAddress)
    return appNav(routes.signUpIntro(), {replace: true})

  if (user.user?.hasEmail) {
    // We don't support changing emails yet
    return appNav(routes.signUpSubmit(), {replace: true})
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
        <Title title="Enter email" />
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
        <Spacer />
        <Button variant="signup-primary" type="submit" disabled={!emailValid}>
          Continue
        </Button>
        <Button
          variant="signup-secondary"
          as={RLink}
          href={routes.signUpSubmit()}
        >
          Skip
        </Button>
      </Stack>
    </form>
  )
  return null
}

export default EmailPage
