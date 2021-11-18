import { Button, ButtonGroup } from '@chakra-ui/button'
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control'
import { Heading, Stack } from '@chakra-ui/layout'
import { Input } from '@chakra-ui/react'
import { Form, useForm } from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import React from 'react'
import { Card } from 'src/components/Card'
import { FindUnsubmittedProfileQuery } from 'types/graphql'
import ProfileStatus from './ProfileStatus'

const PendingApprovalView = (props: {
  onEdit: () => void
  unsubmittedProfile: FindUnsubmittedProfileQuery['unsubmittedProfile']
}) => {
  const methods = useForm<{ email: string }>({
    defaultValues: {
      email: props.unsubmittedProfile?.hasEmail ? '***@***.***' : null,
    },
  })

  const [saveEmail] = useMutation(gql`
    mutation UnsubmittedProfileSetEmailMutation(
      $ethAddress: String!
      $email: String!
    ) {
      unsubmittedProfileSetEmail(ethAddress: $ethAddress, email: $email) {
        ethAddress
      }
    }
  `)

  const onSubmit = async (data) => {
    await saveEmail({
      variables: {
        ethAddress: props.unsubmittedProfile.ethAddress,
        email: data.email,
      },
    })
    // Clear the form isDirty
    methods.reset(data)
  }

  return (
    <Form formMethods={methods} onSubmit={onSubmit}>
      <Stack spacing="6">
        <Heading size="lg">Profile Pending Approval</Heading>
        <ProfileStatus profile={props.unsubmittedProfile} />
        <ButtonGroup alignSelf="flex-end">
          <Button onClick={props.onEdit}>Edit Profile</Button>
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
    </Form>
  )
}

export default PendingApprovalView
