import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl, FormHelperText, FormLabel} from '@chakra-ui/form-control'
import {Heading, Stack} from '@chakra-ui/layout'
import {Input} from '@chakra-ui/react'
import {useForm} from '@redwoodjs/forms'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {CellSuccessProps, createCell, MetaTags} from '@redwoodjs/web'
import React, {useCallback, useContext} from 'react'
import {Card} from 'src/components/Card'
import requireEthAddress from 'src/components/requireEthAddress'
import UserContext from 'src/layouts/UserContext'
import {usePusher} from 'src/lib/pusher'
import ProfileStatus from 'src/pages/SignUp/ProfileStatus'
import {SignUpSubmittedPageQuery} from 'types/graphql'
import {useInterval} from 'usehooks-ts'

type FormFields = {email: string}

const Success = (props: CellSuccessProps<SignUpSubmittedPageQuery>) => {
  if (!props.unsubmittedProfile) return <Redirect to={routes.signUpIntro()} />

  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

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
      <MetaTags title="Profile Pending Approval" />
      <Heading size="lg">Profile Pending Approval</Heading>
      <ProfileStatus profile={props.unsubmittedProfile} />
      <ButtonGroup alignSelf="flex-end">
        <Button onClick={() => navigate(routes.signUpRecord())}>
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
