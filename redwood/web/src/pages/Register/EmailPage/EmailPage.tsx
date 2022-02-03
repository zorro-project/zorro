import {Box, Input, Text} from '@chakra-ui/react'
import {RouteFocus, routes} from '@redwoodjs/router'
import {useMutation} from '@redwoodjs/web'
import {useState} from 'react'
import {RLink} from 'src/components/links'
import {useUser} from 'src/layouts/UserContext'
import {useGuard} from 'src/lib/useGuard'
import {appNav} from 'src/lib/util'
import {requireNoExistingProfile, requireWalletConnected} from 'src/lib/guards'
import {CreateUserMutation, CreateUserMutationVariables} from 'types/graphql'
import RegisterScreen, {TextContainer} from '../RegisterScreen'

const EmailPage: React.FC<{next?: 'submitted' | undefined}> = ({next}) => {
  requireWalletConnected()
  requireNoExistingProfile()
  const user = useUser()

  const nextPage =
    next === 'submitted' ? routes.registerSubmitted() : routes.registerSubmit()

  useGuard(user.loading || !user.user?.hasEmail, nextPage)

  // XXX: has duplicated code with SubmittedPage.tsx
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

  if (user.loading) return null

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flex: '1'}}>
      <RegisterScreen
        title="Get important notifications"
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
        <TextContainer maxW="300">
          <Text>
            Zorro needs to be able to get in touch with you in case your
            citizenship is challenged for being a duplicate or being mistaken.
          </Text>
          <Text>Your email will be kept private.</Text>
        </TextContainer>
      </RegisterScreen>
    </form>
  )
}

export default EmailPage
