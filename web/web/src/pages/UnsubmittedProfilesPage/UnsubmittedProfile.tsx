import { Button, ButtonGroup } from '@chakra-ui/button'
import { Link, Stack, Text } from '@chakra-ui/layout'
import { Td, Tr } from '@chakra-ui/table'
import { Textarea } from '@chakra-ui/textarea'
import { useMutation } from '@redwoodjs/web'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { cairoCompatibleAdd } from 'src/lib/ipfs'
// import { bytesToFelt, notarySubmitProfile } from ''
import { ArrayElement } from 'src/lib/util'
import {
  ApproveProfileMutation,
  ApproveProfileMutationVariables,
  MutationAddNotaryFeedbackArgs,
  UnsubmittedProfilesQuery,
} from 'types/graphql'
import { notarySubmitProfile } from '../../../../api/src/lib/starknet'
import { serializeCid } from '../../../../api/src/lib/serializers'

import getNotaryKey from '../../lib/getNotaryKey'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<UnsubmittedProfilesQuery['unsubmittedProfiles']>
}> = ({ profile }) => {
  const [reviewed, setReviewed] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const feedbackRef = React.useRef<typeof Textarea>()

  const [giveFeedback] = useMutation<MutationAddNotaryFeedbackArgs>(gql`
    mutation AddNotaryFeedback($id: ID!, $feedback: String!) {
      addNotaryFeedback(id: $id, feedback: $feedback)
    }
  `)

  const onGiveFeedback = async () => {
    await giveFeedback({
      variables: { id: profile.id, feedback: feedbackRef.current.value },
    })

    setReviewed(true)
  }

  const [markApproved] = useMutation<
    ApproveProfileMutation,
    ApproveProfileMutationVariables
  >(gql`
    mutation ApproveProfileMutation($id: ID!) {
      approveProfile(id: $id)
    }
  `)

  const onApprove = async () => {
    // setSubmitting(true)

    const cid = await cairoCompatibleAdd(
      JSON.stringify({ photo: profile.photoCID, video: profile.videoCID })
    )

    const submittedProfile = await notarySubmitProfile(
      serializeCid(cid),
      profile.address,
      getNotaryKey()
    )
    console.log(submittedProfile)

    await markApproved({ variables: { id: profile.id } })
    // setReviewed(true)
  }

  if (reviewed) return null

  return (
    <Tr>
      <Td>
        <Text size="xs">
          <Link
            href={`https://etherscan.io/address/${profile.address}`}
            isExternal
          >
            {profile.address}
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
            <Button
              colorScheme="red"
              onClick={onGiveFeedback}
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

export default UnsubmittedProfile
