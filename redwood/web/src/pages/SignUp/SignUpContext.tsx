import {SlideFade, Stack} from '@chakra-ui/react'
import {Form} from '@redwoodjs/forms'
import {navigate, Redirect, routes, useLocation} from '@redwoodjs/router'
import {CellSuccessProps, createCell, useMutation} from '@redwoodjs/web'
import {useContext} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import requireEthAddress from 'src/components/requireEthAddress'
import UserContext from 'src/layouts/UserContext'
import ipfsClient from 'src/lib/ipfs'
import {
  SignupContextQuery,
  UpdateUnsubmittedProfileMutation,
  UpdateUnsubmittedProfileMutationVariables,
} from 'types/graphql'

export type SignupFieldValues = {
  photoCid: Blob | string
  videoCid: Blob | string
  email: string
}

type SignUpContextType = {
  submitProgress: number
  data: SignupContextQuery
}

export const SignUpContext = React.createContext<SignUpContextType>({
  submitProgress: 0,
  data: {},
})

const Success: React.FC<CellSuccessProps<SignupContextQuery>> = (props) => {
  const {pathname} = useLocation()
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

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

  const formMethods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      photoCid: props.unsubmittedProfile?.photoCid,
      videoCid: props.unsubmittedProfile?.videoCid,
    },
  })

  const onSubmit = React.useCallback<SubmitHandler<SignupFieldValues>>(
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
          : (data.photoCid as string)

      const videoCid =
        data.videoCid instanceof Blob
          ? (
              await ipfsClient.add(data.videoCid as Blob, {
                progress: reportProgress,
              })
            ).cid
              .toV1()
              .toString()
          : (data.videoCid as string)

      await updateMutation({
        variables: {
          ethereumAddress,
          input: {
            photoCid,
            videoCid,
          },
        },
      })

      props.refetch?.()
      navigate(routes.signUpSubmitted())
    },
    [ethereumAddress, updateMutation, props.refetch]
  )

  return (
    <SlideFade key={pathname} in={true}>
      <Stack maxW="xl" mx="auto">
        <SignUpContext.Provider
          value={{
            submitProgress,
            data: {unsubmittedProfile: props.unsubmittedProfile},
          }}
        >
          {/* @ts-expect-error TODO: typechecking for redwood forms */}
          <Form onSubmit={onSubmit} formMethods={formMethods}>
            {props.children}
          </Form>
        </SignUpContext.Provider>
      </Stack>
    </SlideFade>
  )
}

const Cell = createCell({
  Success,
  QUERY: gql`
    query SignupContextQuery($ethereumAddress: ID!) {
      unsubmittedProfile(ethereumAddress: $ethereumAddress) {
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
})

export default requireEthAddress(<Cell />)
