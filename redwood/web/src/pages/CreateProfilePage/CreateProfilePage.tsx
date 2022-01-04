import {SlideFade, Stack} from '@chakra-ui/react'
import {Form} from '@redwoodjs/forms'
import {Redirect, routes} from '@redwoodjs/router'
import {
  CellSuccessProps,
  createCell,
  MetaTags,
  useMutation,
} from '@redwoodjs/web'
import {useEthers} from '@usedapp/core'
import {SubmitHandler, useForm} from 'react-hook-form'
import ipfsClient from 'src/lib/ipfs'
import EditView from 'src/pages/CreateProfilePage/EditView'
import {
  FindUnsubmittedProfileQuery,
  FindUnsubmittedProfileQueryVariables,
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'
import PendingApprovalView from './PendingApprovalView'
import PreSubmitView from './PreSubmitView'
import {SignupFieldValues} from './types'

type CellProps = FindUnsubmittedProfileQueryVariables

const Success = ({
  account,
  unsubmittedProfile,
  refetch,
}: CellProps & CellSuccessProps<FindUnsubmittedProfileQuery>) => {
  const methods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      photoCid: unsubmittedProfile?.photoCid,
      videoCid: unsubmittedProfile?.videoCid,
    },
  })
  const [currentView, setCurrentView] = React.useState<
    'Edit' | 'PreSubmit' | 'PendingApproval'
  >(unsubmittedProfile ? 'PendingApproval' : 'Edit')
  const [submitProgress, setSubmitProgress] = React.useState(0)

  const [updateMutation] = useMutation<
    UpdateUnsubmittedProfileMutation,
    UpdateUnsubmittedProfileMutationVariables
  >(gql`
    mutation UpdateUnsubmittedProfileMutation(
      $ethereumAddress: String!
      $input: UpdateUnsubmittedProfileInput!
    ) {
      updateUnsubmittedProfile(
        ethereumAddress: $ethereumAddress
        input: $input
      ) {
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
            ((data.photoCid instanceof Blob ? data.photoCid.size : 0) +
              (data.videoCid instanceof Blob ? data.videoCid.size : 0))
        )

      const photoCid =
        data.photoCid instanceof Blob
          ? (
              await ipfsClient.add(data.photoCid as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : data.photoCid

      const videoCid =
        data.videoCid instanceof Blob
          ? (
              await ipfsClient.add(data.videoCid as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : data.videoCid

      await updateMutation({
        variables: {
          ethereumAddress: account,
          input: {
            photoCid,
            videoCid,
          },
        },
      })

      refetch()
      setCurrentView('PendingApproval')
    },
    [account, updateMutation]
  )

  if (account == null) return <Redirect to={routes.signUpIntro()} />

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
                // @ts-expect-error TODO: typechecking for redwood forms
                <Form formMethods={methods} onSubmit={submit}>
                  <EditView
                    onContinue={() => setCurrentView('PreSubmit')}
                    unsubmittedProfile={unsubmittedProfile}
                  />
                </Form>
              ),
              PreSubmit: (
                // @ts-expect-error TODO: typechecking for redwood forms
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

const CreateProfileCell = createCell<CellProps>({
  QUERY: gql`
    query FindUnsubmittedProfileQuery($account: ID!) {
      unsubmittedProfile(ethereumAddress: $account) {
        photoCid
        videoCid
        hasEmail
        ethereumAddress
        UnaddressedFeedback {
          feedback
        }
      }
    }
  `,
  Success,
})

const CreateProfilePage = () => {
  const {account} = useEthers()
  if (account == null) return <Redirect to={routes.signUpIntro()} />

  return <CreateProfileCell account={account} />
}

export default CreateProfilePage
