import {
  Button,
  ButtonGroup,
  CircularProgress,
  SlideFade,
  Stack,
  Text,
} from '@chakra-ui/react'
import { navigate, routes } from '@redwoodjs/router'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { useEthers } from '@usedapp/core'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import ipfsClient from 'src/lib/ipfsClient'
import {
  Create_Unsubmitted_Profile,
  Find_Unsubmitted_Profile,
  Find_Unsubmitted_ProfileVariables,
  Update_Unsubmitted_Profile,
} from 'types/graphql'
import EditView from 'src/pages/CreateProfilePage/ChooseVideoAndPhoto'
import ReviewView from './ReviewView'
import { SignupFieldValues } from './types'
import { useLazyQuery } from '@apollo/client'

const SignUpPage = () => {
  const methods = useForm<SignupFieldValues>({ mode: 'onChange' })
  const { account } = useEthers()
  const [isReviewing, setIsReviewing] = React.useState(false)
  const [submitProgress, setSubmitProgress] = React.useState(0)

  const formValid = methods.formState.isValid && account != null

  const [loadUnsubmittedProfile, unsubmittedProfile] =
    useLazyQuery<Find_Unsubmitted_Profile>(
      gql`
        query FIND_UNSUBMITTED_PROFILE($ethAddress: String!) {
          unsubmittedProfile(ethAddress: $ethAddress) {
            selfieCID
            videoCID
          }
        }
      `
    )
  React.useEffect(() => {
    if (!account) return
    const queryVars: Find_Unsubmitted_ProfileVariables = { ethAddress: account }

    unsubmittedProfile.called
      ? unsubmittedProfile.refetch(queryVars)
      : loadUnsubmittedProfile({ variables: queryVars })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  React.useEffect(() => {
    if (!unsubmittedProfile.called || unsubmittedProfile.loading) return

    methods.reset({
      selfieCID: unsubmittedProfile.data?.unsubmittedProfile?.selfieCID,
      videoCID: unsubmittedProfile.data?.unsubmittedProfile?.videoCID,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unsubmittedProfile.data])

  const [updateMutation] = useMutation<Update_Unsubmitted_Profile>(gql`
    mutation UPDATE_UNSUBMITTED_PROFILE(
      $ethAddress: String!
      $input: UpdateUnsubmittedProfileInput!
    ) {
      updateUnsubmittedProfile(ethAddress: $ethAddress, input: $input) {
        id
      }
    }
  `)

  const submit = React.useCallback<SubmitHandler<SignupFieldValues>>(
    async (data) => {
      setSubmitProgress(0)
      const reportProgress = (bytes: number) =>
        setSubmitProgress(
          (100 * bytes) /
            (data.selfieCID instanceof Blob ? data.selfieCID.size : 0) +
            (data.videoCID instanceof Blob ? data.videoCID.size : 0)
        )

      const selfieCID =
        data.selfieCID instanceof Blob
          ? (
              await ipfsClient.add(data.selfieCID as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : data.selfieCID

      const videoCID =
        data.videoCID instanceof Blob
          ? (
              await ipfsClient.add(data.videoCID as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : data.videoCID

      await updateMutation({
        variables: {
          ethAddress: account,
          input: {
            selfieCID,
            videoCID,
          },
        },
      })

      navigate(routes.pendingProfile())
    },
    [account, updateMutation]
  )

  let controlButtons = (
    <ButtonGroup pt="6" alignSelf="flex-end">
      {isReviewing ? (
        <>
          <Button onClick={() => setIsReviewing(false)}>Make Changes</Button>
          <Button colorScheme="blue" type="submit" disabled={!formValid}>
            Submit
          </Button>
        </>
      ) : (
        <Button
          colorScheme="teal"
          disabled={!formValid}
          onClick={() => setIsReviewing(true)}
        >
          Continue
        </Button>
      )}
    </ButtonGroup>
  )

  if (methods.formState.isSubmitting) {
    controlButtons = (
      <Stack align="center" justify="center" direction="row" pt="6">
        <CircularProgress value={submitProgress} />
        <Text>Submitting...</Text>
      </Stack>
    )
  }

  return (
    <>
      <MetaTags
        title="Create Profile"
        description="Sign up for a Nym profile"
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(submit)}>
          <SlideFade key={isReviewing.toString()} in={true}>
            <Stack maxW="xl" mx="auto">
              {isReviewing ? <ReviewView /> : <EditView />}
              {controlButtons}
            </Stack>
          </SlideFade>
        </form>
      </FormProvider>
    </>
  )
}

export default SignUpPage
