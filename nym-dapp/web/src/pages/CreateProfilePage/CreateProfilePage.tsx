import { SlideFade, Stack } from '@chakra-ui/react'
import { Form } from '@redwoodjs/forms'
import { Redirect, routes } from '@redwoodjs/router'
import {
  CellSuccessProps,
  createCell,
  MetaTags,
  useMutation,
} from '@redwoodjs/web'
import { useEthers } from '@usedapp/core'
import { SubmitHandler, useForm } from 'react-hook-form'
import ipfsClient from 'src/lib/ipfs'
import EditView from 'src/pages/CreateProfilePage/EditView'
import {
  Find_Unsubmitted_Profile,
  Find_Unsubmitted_ProfileVariables,
  Update_Unsubmitted_Profile,
} from 'types/graphql'
import PendingApprovalView from './PendingApprovalView'
import PreSubmitView from './PreSubmitView'
import { SignupFieldValues } from './types'

type CellProps = Find_Unsubmitted_ProfileVariables

const Success = ({
  account,
  unsubmittedProfile,
  refetch,
}: CellProps & CellSuccessProps<Find_Unsubmitted_Profile>) => {
  const methods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      selfieCID: unsubmittedProfile?.selfieCID,
      videoCID: unsubmittedProfile?.videoCID,
    },
  })
  const [currentView, setCurrentView] = React.useState<
    'Edit' | 'PreSubmit' | 'PendingApproval'
  >(unsubmittedProfile ? 'PendingApproval' : 'Edit')
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
            email: data.email,
          },
        },
      })

      refetch()
      setCurrentView('PendingApproval')
    },
    [account, updateMutation]
  )

  if (account == null) return <Redirect to={routes.signUp()} />

  return (
    <>
      <MetaTags
        title="Create Profile"
        description="Sign up for a Nym profile"
      />

      <SlideFade key={currentView} in={true}>
        <Stack maxW="xl" mx="auto">
          {
            {
              Edit: (
                <Form formMethods={methods} onSubmit={submit}>
                  <EditView
                    onContinue={() => setCurrentView('PreSubmit')}
                    unsubmittedProfile={unsubmittedProfile}
                  />
                </Form>
              ),
              PreSubmit: (
                <Form formMethods={methods} onSubmit={submit}>
                  <PreSubmitView
                    onEdit={() => setCurrentView('Edit')}
                    submitProgress={submitProgress}
                  />
                </Form>
              ),
              PendingApproval: (
                <PendingApprovalView
                  onEdit={() => setCurrentView('Edit')}
                  unsubmittedProfile={unsubmittedProfile}
                />
              ),
            }[currentView]
          }
        </Stack>
      </SlideFade>
    </>
  )
}

const SignUpCell = createCell<CellProps>({
  QUERY: gql`
    query FIND_UNSUBMITTED_PROFILE($account: String!) {
      unsubmittedProfile(ethAddress: $account) {
        selfieCID
        videoCID
        hasEmail
        ethAddress
        UnaddressedFeedback {
          feedback
        }
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
