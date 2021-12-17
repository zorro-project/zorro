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
  FindUnsubmittedProfileQuery,
  FindUnsubmittedProfileQueryVariables,
  UpdateUnsubmittedProfileMutation,
} from 'types/graphql'
import PendingApprovalView from './PendingApprovalView'
import PreSubmitView from './PreSubmitView'
import { SignupFieldValues } from './types'

type CellProps = FindUnsubmittedProfileQueryVariables

const Success = ({
  account,
  unsubmittedProfile,
  refetch,
}: CellProps & CellSuccessProps<FindUnsubmittedProfileQuery>) => {
  const methods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      photoCID: unsubmittedProfile?.photoCID,
      videoCID: unsubmittedProfile?.videoCID,
    },
  })
  const [currentView, setCurrentView] = React.useState<
    'Edit' | 'PreSubmit' | 'PendingApproval'
  >(unsubmittedProfile ? 'PendingApproval' : 'Edit')
  const [submitProgress, setSubmitProgress] = React.useState(0)

  const [updateMutation] = useMutation<UpdateUnsubmittedProfileMutation>(gql`
    mutation UpdateUnsubmittedProfileMutation(
      $address: String!
      $input: UpdateUnsubmittedProfileInput!
    ) {
      updateUnsubmittedProfile(address: $address, input: $input) {
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
            ((data.photoCID instanceof Blob ? data.photoCID.size : 0) +
              (data.videoCID instanceof Blob ? data.videoCID.size : 0))
        )

      const photoCID =
        data.photoCID instanceof Blob
          ? (
              await ipfsClient.add(data.photoCID as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : data.photoCID

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
          address: account,
          input: {
            photoCID,
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
        description="Sign up for a Zorro profile"
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
    query FindUnsubmittedProfileQuery($account: ID!) {
      unsubmittedProfile(address: $account) {
        photoCID
        videoCID
        hasEmail
        address
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
