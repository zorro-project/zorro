import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl, FormHelperText, FormLabel} from '@chakra-ui/form-control'
import {Stack} from '@chakra-ui/layout'
import {Input} from '@chakra-ui/react'
import {useForm} from '@redwoodjs/forms'
import {navigate, routes} from '@redwoodjs/router'
import {CellSuccessProps, createCell} from '@redwoodjs/web'
import React, {useCallback, useContext} from 'react'
import {Card} from 'src/components/Card'
import requireEthAddress from 'src/components/requireEthAddress'
import UserContext from 'src/layouts/UserContext'
import {usePusher} from 'src/lib/pusher'
import {appNav} from 'src/lib/util'
import ProfileStatus from 'src/pages/SignUp/ProfileStatus'
import {SignUpSubmittedPageQuery} from 'types/graphql'
import {useInterval} from 'usehooks-ts'
import Title from '../Title'

type FormFields = {email: string}

const Success = (props: CellSuccessProps<SignUpSubmittedPageQuery>) => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress)
    return appNav(routes.signUpIntro(), {
      toast: {
        title: 'Please connect a wallet',
        status: 'warning',
      },
    })

  if (!props.unsubmittedProfile)
    return appNav(routes.signUpIntro(), {
      toast: {
        title:
          "Couldn't find your submitted profile. Are you connected to the correct wallet?",
        status: 'warning',
      },
    })

  const methods = useForm<FormFields>({
    defaultValues: {
      email: props.user?.hasEmail ? '***@***.***' : undefined,
    },
  })

  const refetch = useCallback(() => {
    props.refetch?.()
  }, [props.refetch])

  usePusher(
    `unsubmittedProfile.${props.unsubmittedProfile?.ethereumAddress}`,
    'updated',
    refetch
  )
  useInterval(refetch, 60 * 1000)

  return (
    <Stack spacing="6" flex="1">
      <Title title="Profile pending approval" />
      <ProfileStatus profile={props.unsubmittedProfile} />
      <ButtonGroup alignSelf="flex-end">
        <Button onClick={() => navigate(routes.signUpVideo())}>
          Edit Profile
        </Button>
      </ButtonGroup>

      <Card>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" {...methods.register('email')} />
          <FormHelperText>
            If you'd like to get updates when your profile is approved or
            reviewed, enter your email here.
          </FormHelperText>
        </FormControl>
        <Button
          variant="signup-primary"
          type="submit"
          colorScheme="blue"
          mt="6"
          disabled={!methods.formState.dirtyFields.email}
        >
          {methods.formState.isSubmitted ? 'Saved' : 'Save'}
        </Button>
      </Card>
    </Stack>
  )
}

const Cell = createCell({
  QUERY: gql`
    query SignUpSubmittedPageQuery($ethereumAddress: ID!) {
      user(ethereumAddress: $ethereumAddress) {
        id
        hasEmail
      }
      unsubmittedProfile(ethereumAddress: $ethereumAddress) {
        id
        ethereumAddress
        UnaddressedFeedback {
          feedback
        }
      }
    }
  `,
  Success,
})

export default requireEthAddress(<Cell />)
