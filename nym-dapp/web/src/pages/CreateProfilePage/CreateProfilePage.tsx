import {
  Button,
  ButtonGroup,
  CircularProgress,
  SlideFade,
  Stack,
  Text,
} from '@chakra-ui/react'
import { navigate, Redirect, routes } from '@redwoodjs/router'
import {
  CellSuccessProps,
  createCell,
  MetaTags,
  useMutation,
} from '@redwoodjs/web'
import { useEthers } from '@usedapp/core'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import ipfsClient from 'src/lib/ipfsClient'
import EditView from 'src/pages/CreateProfilePage/ChooseVideoAndPhoto'
import {
  Find_Unsubmitted_Profile,
  Find_Unsubmitted_ProfileVariables,
  Update_Unsubmitted_Profile,
} from 'types/graphql'
import ReviewView from './ReviewView'
import { SignupFieldValues } from './types'

type CellProps = Find_Unsubmitted_ProfileVariables

const Success = ({
  account,
  unsubmittedProfile,
}: CellProps & CellSuccessProps<Find_Unsubmitted_Profile>) => {
  const methods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      selfieCID: unsubmittedProfile?.selfieCID,
      videoCID: unsubmittedProfile?.videoCID,
    },
  })
  const [isReviewing, setIsReviewing] = React.useState(false)
  const [submitProgress, setSubmitProgress] = React.useState(0)

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
          <Button
            colorScheme="blue"
            type="submit"
            disabled={!methods.formState.isValid}
          >
            Submit
          </Button>
        </>
      ) : (
        <Button
          colorScheme="teal"
          disabled={!methods.formState.isValid}
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

  if (account == null) return <Redirect to={routes.signUp()} />

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

const SignUpCell = createCell<CellProps>({
  QUERY: gql`
    query FIND_UNSUBMITTED_PROFILE($account: String!) {
      unsubmittedProfile(ethAddress: $account) {
        selfieCID
        videoCID
      }
    }
  `,
  Success,
})

const SignUpPage = () => {
  const { account } = useEthers()
  if (account == null) return <Redirect to={routes.signUp()} />

  return <SignUpCell account={account} />
}

export default SignUpPage
