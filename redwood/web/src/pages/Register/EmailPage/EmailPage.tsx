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
import {useEffect, useRef, useState} from 'react'
import {RLink} from 'src/components/links'
import {useUser} from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'
import {CreateUserMutation, CreateUserMutationVariables} from 'types/graphql'
import {requireWalletConnected} from '../guards'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'

const EmailPage: React.FC<{next?: 'submitted' | undefined}> = ({next}) => {
  requireWalletConnected()
  const user = useUser()

  const nextPage =
    next === 'submitted' ? routes.registerSubmitted() : routes.registerSubmit()

  useEffect(() => {
    if (user.user?.hasEmail) {
      // We don't support changing emails yet
      appNav(nextPage, {replace: true})
    }
  }, [user.user?.hasEmail])

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    await user.refetch()
    appNav(nextPage)
  }

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flex: '1'}}>
      <Stack spacing="6" flex="1">
        <RegisterLogo />
        <Title title="Get important notifications" />
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
        <Button variant="register-primary" type="submit" disabled={!emailValid}>
          Continue
        </Button>
        <Button variant="register-secondary" as={RLink} href={nextPage}>
          Skip
        </Button>
      </Stack>
    </form>
  )
  return null
}

export default EmailPage
