import {Button, ButtonGroup} from '@chakra-ui/button'
import {Link, Stack, Text} from '@chakra-ui/layout'
import {Td, Tr} from '@chakra-ui/table'
import {Textarea} from '@chakra-ui/textarea'
import {useMutation} from '@redwoodjs/web'
import {useEffect} from 'react'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {IterableElement} from 'type-fest'
import {
  ApproveRegistrationMutation,
  ApproveRegistrationMutationVariables,
  MarkRegistrationViewed,
  MarkRegistrationViewedVariables,
  MutationdenyRegistrationArgs,
  UnreviewedRegistrationsPageQuery,
} from 'types/graphql'

const Registration: React.FC<{
  registration: IterableElement<
    UnreviewedRegistrationsPageQuery['unreviewedRegistrations']
  >
}> = ({registration}) => {
  const [submitting, setSubmitting] = React.useState(false)
  const feedbackRef = React.useRef<HTMLTextAreaElement>(null)

  const [markViewed] = useMutation<
    MarkRegistrationViewed,
    MarkRegistrationViewedVariables
  >(gql`
    mutation MarkRegistrationViewed($id: ID!) {
      markRegistrationViewed(id: $id) {
        id
      }
    }
  `)
  useEffect(() => {
    markViewed({variables: {id: registration.id.toString()}})
  }, [])

  const [denyRegistration] = useMutation<MutationdenyRegistrationArgs>(gql`
    mutation DenyRegistration($id: ID!, $feedback: String!) {
      denyRegistration(id: $id, feedback: $feedback) {
        id
        reviewedAt
      }
    }
  `)

  const onDenyRegistration = async () => {
    setSubmitting(true)
    await denyRegistration({
      variables: {id: registration.id, feedback: feedbackRef.current?.value},
    })
    setSubmitting(false)
  }

  const [approveRegistration] = useMutation<
    ApproveRegistrationMutation,
    ApproveRegistrationMutationVariables
  >(gql`
    mutation ApproveRegistrationMutation($id: ID!) {
      approveRegistration(id: $id) {
        id
        reviewedAt
      }
    }
  `)

  const onApprove = async () => {
    setSubmitting(true)
    await approveRegistration({variables: {id: registration.id.toString()}})
    setSubmitting(false)
  }

  return (
    <Tr>
      <Td>
        <Text size="xs">
          <Link
            href={`https://etherscan.io/address/${registration.ethereumAddress}`}
            isExternal
          >
            {registration.ethereumAddress}
          </Link>
        </Text>
      </Td>
      <Td>
        <PhotoBox photo={registration.photoCid} width="36" />
      </Td>
      <Td>
        <VideoBox video={registration.videoCid} width="36" />
      </Td>
      <Td>
        <Stack>
          <Textarea
            placeholder="Enter profile feedback here"
            ref={feedbackRef}
          />
          <ButtonGroup size="xs" alignSelf="flex-end">
            <Button
              colorScheme="red"
              onClick={onDenyRegistration}
              disabled={submitting}
            >
              Give Feedback
            </Button>
            <Button
              colorScheme="green"
              onClick={onApprove}
              disabled={submitting}
            >
              Approve
            </Button>
          </ButtonGroup>
        </Stack>
      </Td>
    </Tr>
  )
}

export default Registration
