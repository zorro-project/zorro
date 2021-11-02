import { Button, ButtonGroup } from '@chakra-ui/button'
import { Link, Stack, Text } from '@chakra-ui/layout'
import { Td, Tr } from '@chakra-ui/table'
import { Textarea } from '@chakra-ui/textarea'
import { useMutation } from '@redwoodjs/web'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { ArrayElement } from 'src/lib/util'
import {
  ApproveProfileMutation,
  ApproveProfileMutationVariables,
  MutationAddNotaryFeedbackArgs,
  UnsubmittedProfilesQuery,
} from 'types/graphql'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<UnsubmittedProfilesQuery['unsubmittedProfiles']>
}> = ({ profile }) => {
  const [reviewed, setReviewed] = React.useState(false)
  const feedbackRef = React.useRef<typeof Textarea>()

  const [giveFeedback] = useMutation<MutationAddNotaryFeedbackArgs>(gql`
    mutation AddNotaryFeedback($profileId: Int!, $feedback: String!) {
      addNotaryFeedback(profileId: $profileId, feedback: $feedback)
    }
  `)

  const onGiveFeedback = async () => {
    await giveFeedback({
      variables: { profileId: profile.id, feedback: feedbackRef.current.value },
    })

    setReviewed(true)
  }

  const [approve] = useMutation<
    ApproveProfileMutation,
    ApproveProfileMutationVariables
  >(gql`
    mutation ApproveProfileMutation($profileId: Int!) {
      approveProfile(profileId: $profileId)
    }
  `)
  const onApprove = async () => {
    await approve({ variables: { profileId: profile.id } })
    setReviewed(true)
  }

  if (reviewed) return null

  return (
    <Tr>
      <Td>
        <Text size="xs">
          <Link
            href={`https://etherscan.io/address/${profile.ethAddress}`}
            isExternal
          >
            {profile.ethAddress}
          </Link>
        </Text>
      </Td>
      <Td>
        <PhotoBox photo={profile.photoCID} width="36" />
      </Td>
      <Td>
        <VideoBox video={profile.videoCID} width="36" />
      </Td>
      <Td>
        <Stack>
          <Textarea
            placeholder="Enter profile feedback here"
            ref={feedbackRef}
          />
          <ButtonGroup size="xs" alignSelf="flex-end">
            <Button colorScheme="red" onClick={onGiveFeedback}>
              Give Feedback
            </Button>
            <Button colorScheme="green" onClick={onApprove}>
              Approve
            </Button>
          </ButtonGroup>
        </Stack>
      </Td>
    </Tr>
  )
}

export default UnsubmittedProfile
