import {Box, Input, ListItem, Text, UnorderedList} from '@chakra-ui/react'
import {routes, RouteFocus} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import {useEffect, useRef, useState} from 'react'
import {RLink} from 'src/components/links'
import {useUser} from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'
import {CreateUserMutation, CreateUserMutationVariables} from 'types/graphql'
import {requireWalletConnected} from '../../../lib/guards'
import RegisterScreen, {TextContainer} from '../RegisterScreen'

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
    await user.refetch?.()
    appNav(nextPage)
  }

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flex: '1'}}>
      <RegisterScreen
        title="Important notifications"
        primaryButtonLabel="Continue"
        primaryButtonProps={{type: 'submit', disabled: !emailValid}}
        secondaryButtonLabel="Skip"
        secondaryButtonProps={{as: RLink, href: nextPage}}
      >
        <Box p="4" alignSelf="center">
          <RouteFocus>
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              value={email}
              width={300}
              onChange={(e) => setEmail(e.target.value)}
            />
          </RouteFocus>
        </Box>
        <TextContainer>
          <Box>
            <Text>Get notified about:</Text>
            <UnorderedList stylePosition="inside" mb={4}>
              <ListItem>Challenges to your citizenship</ListItem>
              <ListItem>Citizenship expiration</ListItem>
            </UnorderedList>
            <Text>Your email will not be public on-chain.</Text>
          </Box>
        </TextContainer>
      </RegisterScreen>
    </form>
  )
}

export default EmailPage
